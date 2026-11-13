/**
 * Isometric 2.5D preview projection, not a full GPU/3D renderer.
 * The same simulation/world positions are used in both map views.
 */
export const ISO={halfWidth:10,halfHeight:7,offsetX:400,offsetY:48};
export function projectTile(x,y,options=ISO){
 return {x:options.offsetX+(x-y)*options.halfWidth,
  y:options.offsetY+(x+y)*options.halfHeight};
}
export function unprojectTile(px,py,options=ISO){
 const a=(px-options.offsetX)/options.halfWidth,b=(py-options.offsetY)/options.halfHeight;
 return {x:Math.round((a+b)/2),y:Math.round((b-a)/2)};
}
export function diamond(ctx,cx,cy,fill,height=0,options=ISO){
 const w=options.halfWidth,h=options.halfHeight;
 ctx.beginPath();ctx.moveTo(cx,cy-h-height);ctx.lineTo(cx+w,cy-height);
 ctx.lineTo(cx,cy+h-height);ctx.lineTo(cx-w,cy-height);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();
}
export function block(ctx,x,y,fill="#b3b6ad",height=12,options=ISO){
 const p=projectTile(x,y,options),w=options.halfWidth,h=options.halfHeight;
 ctx.fillStyle="#465563";
 ctx.beginPath();ctx.moveTo(p.x-w,p.y);ctx.lineTo(p.x,p.y+h);
 ctx.lineTo(p.x,p.y+h-height);ctx.lineTo(p.x-w,p.y-height);ctx.closePath();ctx.fill();
 ctx.fillStyle="#65747d";
 ctx.beginPath();ctx.moveTo(p.x,p.y+h);ctx.lineTo(p.x+w,p.y);
 ctx.lineTo(p.x+w,p.y-height);ctx.lineTo(p.x,p.y+h-height);ctx.closePath();ctx.fill();
 diamond(ctx,p.x,p.y,fill,height,options);
}
