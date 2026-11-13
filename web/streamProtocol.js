// Bounded, chunk-safe SSE parser for server version notifications.
// No credentials, match state or commands may be carried over this channel.
export function createVersionDecoder({maxBuffer=16384}={}){
 let buffer="";
 return {
  push(chunk){
   if(typeof chunk!=="string")throw Error("Expected text SSE data");
   buffer+=(chunk.replace(/\r\n/g,"\n"));
   if(buffer.length>maxBuffer)throw Error("SSE frame too large");
   const output=[];
   let end;
   while((end=buffer.indexOf("\n\n"))>=0){
    const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
    const event=frame.split("\n").find(l=>l==="event: version");
    if(!event)continue;
    const data=frame.split("\n").find(l=>l.startsWith("data: "));
    if(!data)continue;
    let payload;
    try{payload=JSON.parse(data.slice(6));}catch{continue;}
    if(payload&&Number.isSafeInteger(payload.version)&&payload.version>=0&&
      Object.keys(payload).length===1)output.push(payload.version);
   }
   return output;
  },
  reset(){buffer="";}
 };
}
