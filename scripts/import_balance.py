#!/usr/bin/env python3
"""Extract six validated game-balance tables from the reconciled .xlsx workbook.
Python standard library only. Usage:
  python3 scripts/import_balance.py AOE_CLONE_Reconciled_Balance_v0_2.xlsx data/balance-v0.2.json
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
TABS = {"land": "Land Units", "naval": "Naval Units", "air": "Air Units",
        "buildings": "Buildings", "research": "Research 540", "upgrades": "Local Upgrades"}
COUNTS = {"land": 132, "naval": 48, "air": 36,
          "buildings": 228, "research": 540, "upgrades": 126}
FACTIONS = ["Humans", "Orcs", "Dwarfs", "Tree Elves", "Corrupt Elves", "Ursa"]

def read_xlsx(filename):
    with zipfile.ZipFile(filename) as z:
        book = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        targets = {x.attrib["Id"]: x.attrib["Target"]
                   for x in rels.findall("{%s}Relationship" % REL)}
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for item in root.findall("x:si", NS):
                shared.append("".join((t.text or "") for t in item.findall(".//x:t", NS)))
        paths = {}
        for sheet in book.findall("x:sheets/x:sheet", NS):
            path = targets[sheet.attrib["{%s}id" % NS["r"]]].lstrip("/")
            if not path.startswith("xl/"):
                path = "xl/" + path
            paths[sheet.attrib["name"]] = path
        data = {}
        for key, tab in TABS.items():
            if tab not in paths:
                raise ValueError("Required tab missing: " + tab)
            root = ET.fromstring(z.read(paths[tab]))
            rows = []
            for xr in root.findall(".//x:sheetData/x:row", NS):
                values = []
                for cell in xr.findall("x:c", NS):
                    column = re.match("[A-Z]+", cell.attrib["r"]).group()
                    index = 0
                    for letter in column:
                        index = index * 26 + (ord(letter) - 64)
                    index -= 1
                    while len(values) <= index:
                        values.append(None)
                    kind = cell.attrib.get("t")
                    if kind == "inlineStr":
                        values[index] = "".join((t.text or "") for t in cell.findall(".//x:t", NS))
                        continue
                    v = cell.find("x:v", NS)
                    if v is None:
                        continue
                    raw = v.text
                    if kind == "s":
                        values[index] = shared[int(raw)]
                    elif kind in ("str", "e"):
                        values[index] = raw
                    elif kind == "b":
                        values[index] = raw == "1"
                    elif raw is not None:
                        try:
                            number = float(raw)
                            values[index] = int(number) if number.is_integer() else number
                        except ValueError:
                            values[index] = raw
                while values and values[-1] is None:
                    values.pop()
                rows.append(values)
            if len(rows) - 1 != COUNTS[key]:
                raise ValueError("%s: expected %d rows; found %d" %
                                 (tab, COUNTS[key], len(rows) - 1))
            data[key] = {"columns": rows[0], "rows": rows[1:]}
        for faction in FACTIONS:
            for key, count in [("land", 22), ("naval", 8), ("air", 6), ("research", 90)]:
                actual = sum(row[0] == faction for row in data[key]["rows"])
                if actual != count:
                    raise ValueError("%s has %d %s rows, expected %d" %
                                     (faction, actual, key, count))
        return data

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 scripts/import_balance.py input.xlsx output.json")
    result = read_xlsx(sys.argv[1])
    destination = Path(sys.argv[2])
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n",
                           encoding="utf-8")
    print("Balance data imported: 216 units, 540 research entries, 228 buildings, 126 upgrades")
