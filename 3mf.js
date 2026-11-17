import * as T from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {ThreeMFLoader} from './vendor/3MFLoader.js';

const host=document.getElementById('view');
const scene=new T.Scene();scene.background=new T.Color('#101619');
const camera=new T.PerspectiveCamera(45,1,.01,100000);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new T.HemisphereLight(0xf0f5ff,0x50565b,2.2));
const key=new T.DirectionalLight(0xffffff,2.0);key.position.set(.6,-.8,1);scene.add(key);
const rim=new T.DirectionalLight(0xe3edff,.7);rim.position.set(-.7,.5,.4);scene.add(rim);

const PRESETS={
  p1:{label:'kissqy 缝合怪摆盘.3mf',src:'./print-projects/kissqy-frankenduck-plates.3mf'},
  p2:{label:'replica 飞特版-BambuStudio2026-11-02.3mf',src:'./print-projects/replica-feite-bambu-2026-11-02.3mf'}
};
let grid=null,model=null;const loader=new ThreeMFLoader();
const info=document.getElementById('info');

function clearModel(){
  if(model){
    scene.remove(model);
    model.traverse(o=>{if(o.geometry)o.geometry.dispose();
      if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});
    model=null;
  }
}
function disposeGrid(){if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose();grid=null;}}
function frame(group){
  const box=new T.Box3().setFromObject(group);
  const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const radius=Math.max(size.x,size.y,size.z)||1;
  camera.near=Math.max(.001,radius/500);camera.far=radius*200;camera.updateProjectionMatrix();
  camera.position.set(center.x+radius*1.4,center.y-radius*1.4,center.z+radius*.9);
  camera.up.set(0,0,1);
  controls.target.copy(center);controls.minDistance=radius*.05;controls.maxDistance=radius*200;
  controls.update();
  disposeGrid();
  const gsize=Math.ceil(radius*2.4/100)*100;
  grid=new T.GridHelper(gsize,20,0x415147,0x23302d);grid.rotation.x=Math.PI/2;
  grid.position.set(center.x,center.y,box.min.z-.01);scene.add(grid);
  return {size,radius};
}
function showInfo(label,group,geo){
  let meshes=0,tris=0;
  group.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
  info.textContent=`${label}
网格对象 ${meshes} 个 · 三角形 ${tris.toLocaleString()}
尺寸 ${geo.size.x.toFixed(1)} × ${geo.size.y.toFixed(1)} × ${geo.size.z.toFixed(1)}（mm，Z 向上）`;
}
function loadBuffer(buffer,label){
  clearModel();
  try{
    const group=loader.parse(buffer);
    model=group;scene.add(group);
    const geo=frame(group);
    showInfo(label,group,geo);
  }catch(err){
    info.textContent='解析失败：'+(err&&err.message||err);
    console.error(err);
  }
}
async function loadURL(src,label){
  try{
    const buf=await (await fetch(encodeURI(src))).arrayBuffer();
    loadBuffer(buf,label);
  }catch(err){
    info.textContent='读取失败：'+(err&&err.message||err);
    console.error(err);
  }
}
function pickFile(file){
  if(!file)return;
  file.arrayBuffer().then(buf=>loadBuffer(buf,file.name));
}

document.getElementById('pick').addEventListener('click',()=>document.getElementById('file').click());
document.getElementById('file').addEventListener('change',e=>pickFile(e.target.files[0]));
for(const [id,p] of Object.entries(PRESETS)){
  document.getElementById(id).addEventListener('click',()=>loadURL(p.src,p.label));
}
window.addEventListener('dragover',e=>{e.preventDefault();document.getElementById('drop').style.display='flex';});
window.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.getElementById('drop').style.display='none';});
window.addEventListener('drop',e=>{e.preventDefault();document.getElementById('drop').style.display='none';pickFile(e.dataTransfer.files[0]);});

const q=new URLSearchParams(location.search);
if(q.get('src'))loadURL(q.get('src'),q.get('label')||q.get('src'));

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(host);resize();
(function loop(){controls.update();renderer.render(scene,camera);requestAnimationFrame(loop);})();