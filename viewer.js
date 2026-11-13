import * as T from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {parseDuck} from './pose.js';

// 官方爆炸偏移表（kissqy docs/assembly-explosion.js），'S*.067' 表示 side*0.067
const SEP={1:[-.014,-.075,.024],4:[-.014,.075,.024],2:[.025,0,-.034],
5:[.024,'S*.067',-.008],6:[.030,'S*.096',-.012],7:[.012,'S*.116',-.014],
8:[-.025,'S*.147',-.017],28:[-.025,'S*.147',-.017],9:[-.025,'S*.185',-.017],
10:[-.060,'S*.132',-.027],11:[-.030,'S*.132',-.095],30:[-.030,'S*.132',-.095],
12:[.023,'S*.132',-.062],31:[.023,'S*.132',-.062],14:[-.052,'S*.123',-.019],
29:[-.052,'S*.123',-.019],15:[0,'S*.067',.033],16:[-.075,0,.060],17:[-.044,-.024,.078],
19:[.100,0,.042],20:[.074,0,-.039],21:[-.012,0,.110],22:[.078,0,.016],
23:[.159,0,.044],24:[.091,0,-.012],25:[-.063,.020,-.029],26:[.127,.025,.043]};
// 打印件中文名（官方表）；轴承/舵机/镜头/扬声器按官方约定保持原位
const CN={1:'右躯干外壳',2:'躯干底座',4:'左躯干外壳',5:'髋部连接件',6:'髋部轴承支架',7:'髋部支架',
8:'左上腿外壳',9:'上腿加强板',10:'小腿结构件',11:'左脚底',12:'左脚掌',14:'左踝支架',
15:'颈部侧板',16:'颈部俯仰连接件',17:'头部转向连接件',19:'面部壳体',20:'嘴部软垫',21:'头盖',
22:'上嘴软垫',23:'眼部外饰件',24:'下颌',25:'头部底壳',26:'镜头支架',28:'右上腿外壳',
29:'右踝支架',30:'右脚底',31:'右脚掌'};
const OTHER={0:'轴承',3:'XL330 舵机',13:'轴承',18:'镜头',27:'扬声器'};

const host=document.getElementById('view');
const scene=new T.Scene();scene.background=new T.Color('#101619');
const camera=new T.PerspectiveCamera(37,1,.005,20);camera.up.set(0,0,1);camera.position.set(.56,0,.23);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;host.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,.145);
controls.minDistance=.065;controls.maxDistance=1.8;controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new T.HemisphereLight(0xf0f5ff,0x50565b,2));
const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(.3,-.4,.8);scene.add(key);
const rim=new T.DirectionalLight(0xe3edff,.8);rim.position.set(-.5,.4,.25);scene.add(rim);
const grid=new T.GridHelper(1.6,32,0x415147,0x23302d);grid.rotation.x=Math.PI/2;grid.position.z=-.001;scene.add(grid);

const [model,manifestText]=await Promise.all([
  (await fetch('./assets/duck-visual.bin')).arrayBuffer(),
  (await fetch('./assets/duck-visual.json')).text()
]);
const model2=parseDuck(model);
const meshNames=Object.keys(JSON.parse(manifestText).source_mesh_sha256);
const geoms=model2.meshes.map(m=>{const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(m.vertices,3));
  g.setAttribute('normal',new T.BufferAttribute(m.normals,3));
  g.setIndex(new T.BufferAttribute(m.indices,1));return g;});
const root=new T.Group();const bodies=[];
model2.bodies.forEach(b=>{const g=new T.Group();g.position.fromArray(b.pos);
  g.quaternion.set(b.quat[1],b.quat[2],b.quat[3],b.quat[0]).normalize();
  (b.parent<0?root:bodies[b.parent]).add(g);bodies.push(g);});
const parts=[];
model2.parts.forEach(p=>{
  const mat=new T.MeshStandardMaterial({color:new T.Color(`rgb(${p.rgb.join(',')})`),roughness:.68,metalness:.03,side:T.DoubleSide});
  const mesh=new T.Mesh(geoms[p.mesh],mat);mesh.position.fromArray(p.pos);
  mesh.quaternion.set(p.quat[1],p.quat[2],p.quat[3],p.quat[0]).normalize();
  bodies[p.body].add(mesh);parts.push({mesh,p,extra:0});});
scene.add(root);root.updateMatrixWorld(true);
const box=new T.Box3().setFromObject(root);root.position.z=-box.min.z;root.updateMatrixWorld(true);

// 零件命名 + 爆炸本地偏移预计算
const counters={};
for(const it of parts){
  const base=meshNames[it.p.mesh]||('mesh_'+it.p.mesh);
  counters[base]=(counters[base]||0)+1;
  it.name=base+'_'+String(counters[base]).padStart(2,'0');
  it.cn=CN[it.p.mesh]||OTHER[it.p.mesh]||base;
  it.label=it.cn+' · '+it.name;
  it.rest=it.mesh.position.clone();
  const d=SEP[it.p.mesh];
  if(!d){it.localDelta=new T.Vector3(0,0,0);continue;}
  const c=new T.Box3().setFromObject(it.mesh).getCenter(new T.Vector3());
  const side=c.y<0?-1:1;
  const delta=new T.Vector3(d[0], typeof d[1]==='string'?side*parseFloat(d[1].slice(2)):d[1], d[2]);
  const pq=new T.Quaternion();it.mesh.parent.getWorldQuaternion(pq);
  it.localDelta=delta.applyQuaternion(pq.invert());
}

// ---- 交互状态 ----
let g=0,selected=null;
const gs=document.getElementById('gboom'),gval=document.getElementById('gval');
const ps=document.getElementById('pboom'),pval=document.getElementById('pval');
const pbox=document.getElementById('partbox'),pname=document.getElementById('pname');

function apply(){
  for(const it of parts)it.mesh.position.copy(it.rest).addScaledVector(it.localDelta,g+it.extra);
}
function setSelect(it){
  if(selected){selected.mesh.material.emissive.setHex(0);selected.mesh.material.emissiveIntensity=0;}
  selected=it;
  if(it){
    it.mesh.material.emissive.setHex(0xc8ff6b);it.mesh.material.emissiveIntensity=.55;
    pname.textContent=it.label+(SEP[it.p.mesh]?'':'（保持原位）');
    pbox.style.display='flex';
    ps.disabled=!SEP[it.p.mesh];
    ps.value=String(Math.round(it.extra*100));pval.textContent=Math.round(it.extra*100)+'%';
  }else{pbox.style.display='none';}
}
gs.addEventListener('input',()=>{g=gs.value/100;gval.textContent=gs.value+'%';apply();});
ps.addEventListener('input',()=>{if(!selected)return;selected.extra=ps.value/100;pval.textContent=ps.value+'%';apply();});
document.getElementById('reset').addEventListener('click',()=>{
  g=0;for(const it of parts)it.extra=0;
  gs.value='0';gval.textContent='0%';setSelect(null);apply();});

// 点击零件选中（与拖动旋转区分：位移 <5px 视为点击）
const ray=new T.Raycaster();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down=(e.isPrimary&&e.button===0)?{x:e.clientX,y:e.clientY}:null;});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;down=null;
  const b=renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),camera);
  const hit=ray.intersectObjects(parts.map(i=>i.mesh),false)[0];
  setSelect(hit?parts.find(i=>i.mesh===hit.object):null);
});

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(host);resize();
(function frame(){controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);})();