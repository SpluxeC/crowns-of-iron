/** Minimal per-pixel UV diffuse texture shader for skinned glTF preview units.
 * Does not implement full metallic/roughness PBR or normal maps.
 * Uses original faction 32x32 RGB maps as GPU TEXTURE_2D resources. */
export function appendUvMesh(target,mesh,{x=0,y=0,z=0,scale=1,tint=[1,1,1]}={}){
 if(!mesh?.textured||mesh.uvs.length!==mesh.vertexCount*2)
  throw Error("UV geometry required for GPU texture draw");
 for(let i=0;i<mesh.vertexCount;i++){
  const offset=i*6;
  target.push(x+mesh.vertices[offset]*scale,y+mesh.vertices[offset+1]*scale,
   z+mesh.vertices[offset+2]*scale,
   mesh.vertices[offset+3]*tint[0],mesh.vertices[offset+4]*tint[1],
   mesh.vertices[offset+5]*tint[2],mesh.uvs[i*2],mesh.uvs[i*2+1]);
 }
}
function compile(gl,type,source){
 const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
 return shader;
}
export function createUvTextureRenderer(gl){
 if(typeof gl?.createTexture!=="function"||typeof gl?.texImage2D!=="function"||
  typeof gl?.uniform1i!=="function"||typeof gl?.activeTexture!=="function")return null;
 const vs=compile(gl,gl.VERTEX_SHADER,`
attribute vec3 a_position;attribute vec3 a_color;attribute vec2 a_uv;
uniform vec3 u_eye,u_right,u_up,u_forward;
uniform float u_tan,u_aspect;varying vec3 v_color;varying vec2 v_uv;
void main(){
 vec3 d=a_position-u_eye;float depth=max(dot(d,u_forward),.1);
 float clipZ=depth*(350.1)/(349.9)-(70.0)/(349.9);
 gl_Position=vec4(dot(d,u_right)/(u_tan*u_aspect),
   dot(d,u_up)/u_tan,clipZ,depth);
 v_color=a_color;v_uv=a_uv;
}`);
 const fs=compile(gl,gl.FRAGMENT_SHADER,`
precision mediump float;varying vec3 v_color;varying vec2 v_uv;
uniform sampler2D u_sampler;
void main(){
 vec3 tex=texture2D(u_sampler,v_uv).rgb;
 gl_FragColor=vec4(v_color*(0.66+0.34*tex),1.0);
}`);
 const program=gl.createProgram();
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))
  throw Error(gl.getProgramInfoLog(program));
 const attributes=["a_position","a_color","a_uv"].map(name=>gl.getAttribLocation(program,name));
 const uniforms=Object.fromEntries(["u_eye","u_right","u_up","u_forward","u_tan","u_aspect",
  "u_sampler"].map(name=>[name,gl.getUniformLocation(program,name)]));
 const buffer=gl.createBuffer(),textures=new Map();
 function textureFor(faction,ppm){
  if(textures.has(faction))return textures.get(faction);
  if(!ppm||ppm.width>256||ppm.height>256)throw Error("Invalid GPU texture");
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei?.(gl.UNPACK_ALIGNMENT,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,ppm.width,ppm.height,0,
   gl.RGB,gl.UNSIGNED_BYTE,ppm.pixels);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  textures.set(faction,texture);return texture;
 }
 let drawn=0;
 return {
  draw(batches,patterns,camera,canvas){
   gl.useProgram(program);
   for(const name of ["eye","right","up","forward"]){
    const p=camera[name];gl.uniform3f(uniforms["u_"+name],p.x,p.y,p.z);
   }
   gl.uniform1f(uniforms.u_tan,camera.tanHalfFov);
   gl.uniform1f(uniforms.u_aspect,canvas.width/canvas.height);
   gl.uniform1i(uniforms.u_sampler,0);
   drawn=0;
   for(const [faction,vertices] of batches){
    if(!vertices.length||!patterns?.[faction])continue;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,textureFor(faction,patterns[faction]));
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);
    for(let i=0;i<3;i++){
     if(attributes[i]<0)continue;
     gl.enableVertexAttribArray(attributes[i]);
     gl.vertexAttribPointer(attributes[i],i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);
    }
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/8);drawn+=vertices.length/8;
   }
  },
  stats(){return {textures:textures.size,texturedVertices:drawn};},
  dispose(){for(const tex of textures.values())gl.deleteTexture(tex);
   gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}
 };
}
