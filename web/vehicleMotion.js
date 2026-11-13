import {rosterDomain} from "./rosterArt.js";
/** Procedural vehicle movement; never feeds back into authoritative RTS position.
 * Angles are local rotations in radians for an original Y-up OBJ mesh. */
export function vehicleMotion(role,mode="idle",timeMs=0,seed=0){
 if(!Number.isFinite(timeMs)||!Number.isFinite(seed)||
  !["idle","walk","attack"].includes(mode))throw Error("Invalid vehicle motion");
 const domain=rosterDomain(role);
 const siege=["Battering Ram","Siege Tower","Heavy Artillery",
  "Heavy War Machine","Legendary Land","Heavy Mobile"].includes(role);
 if(domain==="land"&&!siege||!domain)return null;
 const t=timeMs/1000+seed,action=mode==="attack"?1:mode==="walk"?.7:.2;
 if(domain==="naval")return {pitch:.022*Math.sin(t*2.1),
  roll:.040*Math.cos(t*1.55),yaw:0,
  rise:.033*Math.sin(t*1.85),recoil:mode==="attack"?.035*Math.sin(t*13):0};
 if(domain==="air")return {pitch:.05*Math.sin(t*1.7)*action,
  roll:.09*Math.sin(t*2.4)*action,yaw:.025*Math.cos(t*1.5),
  rise:.14*Math.sin(t*2.2),recoil:mode==="attack"?.06*Math.sin(t*16):0};
 return {pitch:mode==="attack"?-.07*Math.sin(t*12):.008*Math.sin(t*3),
  roll:mode==="walk"?.02*Math.sin(t*7):0,yaw:0,
  rise:mode==="walk"?.018*Math.sin(t*9):0,
  recoil:mode==="attack"?.11*Math.max(0,Math.sin(t*10)):0};
}
export function transformVehicleVertex(x,y,z,motion){
 if(!motion)return [x,y,z];
 const {pitch=0,roll=0,yaw=0,rise=0,recoil=0}=motion;
 const c1=Math.cos(roll),s1=Math.sin(roll),
  c2=Math.cos(pitch),s2=Math.sin(pitch),
  c3=Math.cos(yaw),s3=Math.sin(yaw);
 // Roll around forward Z, pitch around X, yaw around up Y.
 const xx=x*c1-y*s1,yy=x*s1+y*c1;
 const yp=yy*c2-z*s2,zp=yy*s2+z*c2;
 return [xx*c3+zp*s3,yp+rise,-xx*s3+zp*c3-recoil];
}
