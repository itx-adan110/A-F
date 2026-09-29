const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const menuBtn=$(".menu-btn"),navWrap=$(".nav-wrap");
function closeMenu(){
  navWrap?.classList.remove("open");
  menuBtn?.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded","false");
  menuBtn?.setAttribute("aria-label","Open menu");
}
menuBtn?.addEventListener("click",()=>{
  const open=navWrap.classList.toggle("open");
  menuBtn.classList.toggle("open",open);
  menuBtn.setAttribute("aria-expanded",String(open));
  menuBtn.setAttribute("aria-label",open?"Close menu":"Open menu");
});
$$(".nav-links a").forEach(a=>a.addEventListener("click",closeMenu));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});
$$("[data-scroll]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();const t=$(el.dataset.scroll);t?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}));

/* Theme */
const themeButton=$(".theme-toggle"),themeIcon=$(".theme-icon"),themeLabel=$(".theme-label");
function setTheme(theme){
  document.body.classList.toggle("light",theme==="light");
  localStorage.setItem("portfolio-theme",theme);
  const light=theme==="light";
  themeIcon.textContent=light?"☀":"☾";
  themeLabel.textContent=light?"Light":"Dark";
  themeButton.setAttribute("aria-label",light?"Switch to dark theme":"Switch to light theme");
}
setTheme(localStorage.getItem("portfolio-theme")||"dark");
themeButton?.addEventListener("click",()=>setTheme(document.body.classList.contains("light")?"dark":"light"));

/* Active navigation + hero pagination */
const sectionEls=$$("main section[id]");
const pageDots=$$(".page-dot");
const navLinks=$$(".nav-links a");
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const id="#"+entry.target.id;
    navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===id));
    const pageIndex=["#home","#about","#skills"].indexOf(id);
    if(pageIndex>=0)pageDots.forEach((d,i)=>d.classList.toggle("active",i===pageIndex));
  });
},{rootMargin:"-42% 0px -48% 0px",threshold:0});
sectionEls.forEach(s=>observer.observe(s));

/* Hero spotlight + supplied global cursor trail */
const heroNames=$$('.hero-name');
const coarse=matchMedia('(pointer:coarse)').matches;

function updateSpotlight(x,y){
  heroNames.forEach(heroText=>{
    const rect=heroText.getBoundingClientRect();
    heroText.style.setProperty('--x',`${x-rect.left}px`);
    heroText.style.setProperty('--y',`${y-rect.top}px`);
  });
}

/* Desktop: the red light follows the pointer anywhere on the page. */
if(!coarse){
  addEventListener('pointermove',e=>{
    updateSpotlight(e.clientX,e.clientY);
  },{passive:true});
}

/* Mobile: the same spotlight follows the finger without enabling the
   desktop canvas trail. */
addEventListener('touchmove',e=>{
  if(e.touches.length)updateSpotlight(e.touches[0].clientX,e.touches[0].clientY);
},{passive:true});
addEventListener('touchstart',e=>{
  if(e.touches.length)updateSpotlight(e.touches[0].clientX,e.touches[0].clientY);
},{passive:true});

/* Supplied short professional tapered trail, applied to the entire viewport. */
const canvas=$('#trailCanvas');
const ctx=canvas?.getContext('2d');
let points=[];
const MAX_POINTS=16;
const FADE_SPEED=.06;

function resizeCanvas(){
  if(!canvas||!ctx)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(innerWidth*dpr);
  canvas.height=Math.round(innerHeight*dpr);
  canvas.style.width=`${innerWidth}px`;
  canvas.style.height=`${innerHeight}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize',resizeCanvas,{passive:true});
resizeCanvas();

function getThemeRGB(){
  return getComputedStyle(document.body).getPropertyValue('--cursor-trail').trim() || '245, 235, 224';
}

if(!coarse&&canvas&&ctx){
  addEventListener('pointermove',e=>{
    points.push({x:e.clientX,y:e.clientY,age:1});
    if(points.length>MAX_POINTS)points.shift();
  },{passive:true});

  function drawSmoothedPath(pts){
    if(pts.length<2)return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length-1;i++){
      const xc=(pts[i].x+pts[i+1].x)/2;
      const yc=(pts[i].y+pts[i+1].y)/2;
      ctx.quadraticCurveTo(pts[i].x,pts[i].y,xc,yc);
    }
    ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
  }

  function animateCursorTrail(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    if(points.length>1){
      const rgb=getThemeRGB();
      ctx.lineCap='round';
      ctx.lineJoin='round';

      ctx.strokeStyle=`rgba(${rgb},.72)`;
      ctx.lineWidth=4.5;
      drawSmoothedPath(points);
      ctx.stroke();

      ctx.strokeStyle=`rgba(${rgb},1)`;
      ctx.lineWidth=2;
      drawSmoothedPath(points);
      ctx.stroke();
    }

    for(const point of points)point.age-=FADE_SPEED;
    points=points.filter(point=>point.age>0);
    requestAnimationFrame(animateCursorTrail);
  }
  animateCursorTrail();
}

/* Three.js */
let THREE=null;
try{THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js")}catch(e){console.warn("Three.js could not load.",e)}

const skills=[
  {name:"HTML",level:"FOUNDATION",value:72,desc:"Semantic structure, accessible markup and clean component foundations."},
  {name:"CSS",level:"DEVELOPING",value:58,desc:"Responsive layouts, motion systems and polished visual details."},
  {name:"JAVASCRIPT",level:"BUILDING",value:55,desc:"Interactive interfaces, DOM systems and browser-side logic."},
  {name:"WEBGL",level:"EXPERIMENTAL",value:42,desc:"3D scenes, interaction layers and spatial web experiences."},
  {name:"AI TOOLS",level:"WORKFLOW",value:66,desc:"AI-assisted ideation, integration and faster creative workflows."},
  {name:"RESPONSIVE",level:"CORE",value:78,desc:"Interfaces designed to adapt smoothly across real screen sizes."}
];

const skillName=$("#skillName"),skillDesc=$("#skillDescription"),skillBar=$("#skillBar"),skillLevel=$("#skillLevel"),skillIndex=$("#skillIndex"),skillCounter=$("#skillCounter"),skillLabels=$("#skillLabels");
function selectSkill(i){
  const s=skills[i];if(!s)return;
  skillName.textContent=s.name;skillDesc.textContent=s.desc;skillLevel.textContent=s.level;
  skillBar.style.width=s.value+"%";skillIndex.textContent=String(i+1).padStart(2,"0");skillCounter.textContent=String(i+1).padStart(2,"0");
  $$(".skill-node-label").forEach((el,n)=>el.classList.toggle("active",n===i));
}
skills.forEach((s,i)=>{const el=document.createElement("button");el.type="button";el.className="skill-node-label";el.textContent=s.name;el.dataset.index=i;el.addEventListener("click",()=>selectSkill(i));skillLabels?.append(el)});
selectSkill(0);

function setupSkills(){
  if(!THREE)return;
  const canvas=$("#skillsWebGL"),stage=$("#skillStage");if(!canvas||!stage)return;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.z=7;
  const group=new THREE.Group();scene.add(group);
  const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(2.05,2),new THREE.MeshBasicMaterial({wireframe:true,transparent:true,opacity:.32,color:0xe9edef}));
  group.add(sphere);
  const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(1.72,1),new THREE.MeshBasicMaterial({wireframe:true,transparent:true,opacity:.1,color:0xe9edef}));group.add(inner);
  const nodes=new THREE.Group();group.add(nodes);
  const points=skills.map((s,i)=>{
    const a=Math.acos(1-2*(i+.5)/skills.length),b=Math.PI*(3-Math.sqrt(5))*i;
    const p=new THREE.Vector3(Math.sin(a)*Math.cos(b),Math.sin(a)*Math.sin(b),Math.cos(a)).multiplyScalar(2.18);
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.085,12,12),new THREE.MeshBasicMaterial({color:0xe9edef}));
    mesh.position.copy(p);mesh.userData.index=i;nodes.add(mesh);return mesh;
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(99,99);
  let targetRotX=0,targetRotY=0,drag=false,lastX=0,lastY=0;
  function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);resize();
  function pick(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(points)[0];if(hit)selectSkill(hit.object.userData.index)}
  canvas.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);pick(e)});
  canvas.addEventListener("pointermove",e=>{const dx=e.clientX-lastX,dy=e.clientY-lastY;if(drag){targetRotY+=dx*.006;targetRotX+=dy*.006}lastX=e.clientX;lastY=e.clientY;pick(e)});
  canvas.addEventListener("pointerup",()=>drag=false);canvas.addEventListener("pointercancel",()=>drag=false);
  function animate(){requestAnimationFrame(animate);group.rotation.y+=(targetRotY-group.rotation.y)*.06;group.rotation.x+=(targetRotX-group.rotation.x)*.06;group.rotation.y+=.002;nodes.children.forEach((n,i)=>{const active=Number(skillIndex.textContent)-1===i;n.scale.lerp(new THREE.Vector3(active?1.7:1,active?1.7:1,active?1.7:1),.1)});renderer.render(scene,camera)}
  animate();
}
setupSkills();

/* Services */
const serviceData={
  web:["01","WEB DEVELOPMENT","Responsive, structured websites with thoughtful motion and fast interactions."],
  ui:["02","UI / UX","Clear interfaces that balance hierarchy, usability and visual character."],
  ai:["03","AI INTEGRATION","Useful AI-assisted experiences connected to practical product workflows."],
  motion:["04","INTERACTION","Micro-interactions, transitions and spatial movement that support the interface."]
};
const serviceName=$("#serviceName"),serviceDescription=$("#serviceDescription"),serviceIndex=$("#serviceIndex");
$$(".service-node").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".service-node").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  const d=serviceData[btn.dataset.service];serviceIndex.textContent=d[0];serviceName.textContent=d[1];serviceDescription.textContent=d[2];
}));

/* Projects */
const projects=[
  {name:"Commonly",type:"FREELANCER MARKETPLACE",desc:"A professional marketplace designed for freelancers and clients to discover services, connect, collaborate, and manage work in one place.",tags:["Freelancers","Clients","Marketplace"],image:"Commonly.png",url:"https://itx-110.github.io/Commonly"},
  {name:"Luminai",type:"AI MULTI-TOOL PLATFORM",desc:"A modular digital platform bringing AI assistance, education, useful tools, and interactive experiences together in one focused workspace.",tags:["AI","Education","Web Platform"],image:"Luminai.png",url:"https://itx-110.github.io/Luminai"},
  {name:"Showroom",type:"WEB EXPERIENCE",desc:"A curated digital showroom built to present projects and interactive work through a clean, focused web experience.",tags:["Showcase","Frontend","Interaction"],image:"Showroom.png",url:"https://itx-110.github.io/Showroom"}
];
let projectIndex=0;
const pCard=$(".project-card"),pType=$("#projectType"),pNum=$("#projectNumber"),pTitle=$("#projectTitle"),pDesc=$("#projectDescription"),pTags=$("#projectTags"),pImg=$("#projectPreviewImage"),pLink=$("#projectViewButton"),pPreview=$("#projectPreview");
function renderProject(i){
  const p=projects[i];pType.textContent=p.type;pNum.textContent=`${String(i+1).padStart(2,"0")} / 03`;pTitle.textContent=p.name;pDesc.textContent=p.desc;pImg.src=p.image;pImg.alt=`${p.name} project preview`;pLink.href=p.url;
  pTags.innerHTML=p.tags.map(t=>`<span>${t}</span>`).join("");
}
function changeProject(dir){
  const cls=dir>0?"project-leave-left":"project-leave-right";pCard.classList.remove("project-enter-left","project-enter-right");pCard.classList.add(cls);
  setTimeout(()=>{projectIndex=(projectIndex+dir+projects.length)%projects.length;renderProject(projectIndex);pCard.classList.remove(cls);pCard.classList.add(dir>0?"project-enter-right":"project-enter-left");requestAnimationFrame(()=>setTimeout(()=>pCard.classList.remove("project-enter-right","project-enter-left"),20))},360);
}
$(".project-arrow-prev")?.addEventListener("click",()=>changeProject(-1));
$(".project-arrow-next")?.addEventListener("click",()=>changeProject(1));
pPreview?.addEventListener("click",()=>pPreview.classList.toggle("is-exploring"));
pPreview?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pPreview.classList.toggle("is-exploring")}});
renderProject(0);

/* Project WebGL: restrained spatial layer */
function setupProjectGL(){
  if(!THREE)return;
  const canvas=$("#projectWebGL"),host=$("#projectPreview");if(!canvas||!host)return;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=5;
  const group=new THREE.Group();scene.add(group);
  const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1),new THREE.MeshBasicMaterial({wireframe:true,color:0xe9edef,transparent:true,opacity:.3}));group.add(mesh);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2,.012,8,100),new THREE.MeshBasicMaterial({color:0xe9edef,transparent:true,opacity:.18}));ring.rotation.x=.9;group.add(ring);
  function resize(){const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();
  let tx=0,ty=0;host.addEventListener("pointermove",e=>{const r=host.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*.8;ty=((e.clientY-r.top)/r.height-.5)*.5});
  function animate(){requestAnimationFrame(animate);group.rotation.y+=(ty-group.rotation.y)*.03;group.rotation.x+=(tx-group.rotation.x)*.03;mesh.rotation.z+=.003;ring.rotation.z-=.002;renderer.render(scene,camera)}animate();
}
setupProjectGL();

/* Keep viewport clean after resize/orientation changes. */
addEventListener("resize",()=>{if(innerWidth>760)closeMenu()});
