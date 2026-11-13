import * as T from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {parseDuck} from './pose.js';

const SEP={1:[-.014,-.075,.024],4:[-.014,.075,.024],2:[.025,0,-.034],
5:[.024,'S*.067',-.008],6:[.030,'S*.096',-.012],7:[.012,'S*.116',-.014],
8:[-.025,'S*.147',-.017],28:[-.025,'S*.147',-.017],9:[-.025,'S*.185',-.017],
10:[-.060,'S*.132',-.027],11:[-.030,'S*.132',-.095],30:[-.030,'S*.132',-.095],
12:[.023,'S*.132',-.062],31:[.023,'S*.132',-.062],14:[-.052,'S*.123',-.019],
29:[-.052,'S*.123',-.019],15:[0,'S*.067',.033],16:[-.075,0,.060],17:[-.044,-.024,.078],
19:[.100,0,.042],20:[.074,0,-.039],21:[-.012,0,.110],22:[.078,0,.016],
23:[.159,0,.044],24:[.091,0,-.012],25:[-.063,.020,-.029],26:[.127,.025,.043]};

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
const model=parseDuck(await (await fetch('./assets/duck-visual.bin')).arrayBuffer());
const geoms=model.meshes.map(m=>{const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(m.vertices,3));
  g.setAttribute('normal',new T.BufferAttribute(m.normals,3));
  g.setIndex(new T.BufferAttribute(m.indices,1));return g;});
const root=new T.Group();const bodies=[];
model.bodies.forEach(b=>{const g=new T.Group();g.position.fromArray(b.pos);
  g.quaternion.set(b.quat[1],b.quat[2],b.quat[3],b.quat[0]).normalize();
  (b.parent<0?root:bodies[b.parent]).add(g);bodies.push(g);});
const parts=[];
model.parts.forEach((p,pi)=>{
  const mat=new T.MeshStandardMaterial({color:new T.Color(`rgb(${p.rgb.join(',')})`),roughness:.68,metalness:.03,side:T.DoubleSide});
  const mesh=new T.Mesh(geoms[p.mesh],mat);mesh.position.fromArray(p.pos);
  mesh.quaternion.set(p.quat[1],p.quat[2],p.quat[3],p.quat[0]).normalize();
  bodies[p.body].add(mesh);parts.push({mesh,pi,p});});
scene.add(root);root.updateMatrixWorld(true);
const box=new T.Box3().setFromObject(root);root.position.z=-box.min.z;root.updateMatrixWorld(true);
// 预计算每个零件的爆炸本地偏移（root 方向 → 父骨骼局部方向），side 按装配态包围盒中心 y
for(const it of parts){
  it.rest=it.mesh.position.clone();
  const d=SEP[it.p.mesh];
  if(!d){it.localDelta=new T.Vector3(0,0,0);continue;}
  const c=new T.Box3().setFromObject(it.mesh).getCenter(new T.Vector3());
  const side=c.y<0?-1:1;
  const delta=new T.Vector3(d[0], typeof d[1]==='string'?side*parseFloat(d[1].slice(2)):d[1], d[2]);
  const pq=new T.Quaternion();it.mesh.parent.getWorldQuaternion(pq);
  it.localDelta=delta.applyQuaternion(pq.invert());
}
let exploded=false;
const btn=document.getElementById('boom');
btn.addEventListener('click',()=>{exploded=!exploded;btn.textContent=exploded?'合拢':'爆炸展开';
  for(const it of parts){it.mesh.position.copy(it.rest);if(exploded)it.mesh.position.add(it.localDelta);}
});
function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(host);resize();
(function frame(){controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);})();
