// 「動きを減らす」設定：見出しはシンプルにゆっくり動かし（光を減らし遅く、曲がる光は出さず、計算式はゆっくり薄く）、説明の絵は半分の速さで動かす
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=document.getElementById('bg'),cx=cv.getContext('2d');
let W,H,dpr,VP,mode='holo';
function rs(){dpr=Math.min(window.devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);VP={x:W*0.70,y:H*0.42};build();}
let rails=[];
function build(){rails=[];
 const nW=8,nF=16;
 for(let i=0;i<=nW;i++){const y=-H*0.15+i*(H*1.05/nW);rails.push({x:0,y:y,kind:'wall'});}
 for(let i=0;i<=nF;i++){const x=-W*0.25+i*(W*1.45/nF);rails.push({x:x,y:H,kind:'floor'});}
 rails.push({x:0,y:H,kind:'seam'});
 // 色の帯は大きさが変わった時だけ作り直す（毎回作らない）
 for(const r of rails){const base=r.kind==='seam'?.6:(r.kind==='wall'?.26:.38);r.g=cx.createLinearGradient(r.x,r.y,VP.x,VP.y);
  r.g.addColorStop(0,col(0,base));r.g.addColorStop(.75,col(.75,base*.7));r.g.addColorStop(1,col(1,0));}
 bgG=cx.createRadialGradient(VP.x,VP.y,0,VP.x,VP.y,Math.max(W,H)*0.9);
 bgG.addColorStop(0,mode==='holo'?'rgba(55,62,185,.08)':'rgba(255,232,210,.55)');bgG.addColorStop(.35,'rgba(255,148,26,.04)');bgG.addColorStop(1,'rgba(255,255,255,0)');
}
let bgG;
function lerp(a,b,t){return a+(b-a)*t}
function col(t,a){
 const near=[255,148,26],far=mode==='holo'?[55,62,185]:[239,140,60];
 const c=near.map((v,i)=>Math.round(lerp(v,far[i],t)));return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function persp(t){return 1-Math.pow(1-t,2.2)}
const streaks=[];
function spawn(){const r=rails[Math.floor(Math.random()*rails.length)];if(r.kind==='seam'&&Math.random()<.5)return;
 streaks.push({r,t:0,v:(0.0035+Math.random()*0.004)*(RM?.5:1),len:0.10+Math.random()*0.08});}

const circuits=[];let useCircuit=!RM;
function surfPt(surf,u,t){const p=persp(Math.max(0,Math.min(t,1)));
 const bx=surf==='floor'?lerp(-W*0.25,W*1.2,u):0, by=surf==='floor'?H:lerp(-H*0.15,H,u);
 return [lerp(bx,VP.x,p),lerp(by,VP.y,p)];}
function spawnCircuit(){const surf=Math.random()<0.6?'floor':'wall';
 let u=surf==='floor'?0.2+Math.random()*0.6:0.35+Math.random()*0.6, t=0.02+Math.random()*0.1;
 const pts=[[u,t]];let dir=1;
 while(t<0.92){t=Math.min(0.95,t+0.08+Math.random()*0.16);pts.push([u,t]);
  if(t>=0.92)break;
  const du=(0.04+Math.random()*0.1)*(Math.random()<.5?-1:1);u=Math.max(0.02,Math.min(0.98,u+du));pts.push([u,t]);}
 const cum=[0];for(let i=1;i<pts.length;i++){cum.push(cum[i-1]+Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]));}
 circuits.push({surf,pts,cum,len:cum[cum.length-1],head:0,v:0.006+Math.random()*0.004,L:0.18});}
function at(c,d){d=Math.max(0,Math.min(d,c.len));let i=1;while(i<c.cum.length-1&&c.cum[i]<d)i++;
 const a=c.pts[i-1],b=c.pts[i],seg=c.cum[i]-c.cum[i-1]||1e-6,k=(d-c.cum[i-1])/seg;return {u:lerp(a[0],b[0],k),t:lerp(a[1],b[1],k),i};}
function drawCircuits(){
 if(useCircuit&&Math.random()<0.035&&circuits.length<6)spawnCircuit();
 for(let n=circuits.length-1;n>=0;n--){const c=circuits[n];c.head+=c.v;
  const d1=Math.min(c.head,c.len),d0=Math.max(c.head-c.L,0);
  const A=at(c,d0),B=at(c,d1);const poly=[[A.u,A.t]];
  for(let i=A.i;i<B.i;i++)poly.push(c.pts[i]);poly.push([B.u,B.t]);
  const fade=c.head>c.len?Math.max(0,1-(c.head-c.len)/c.L):1;
  const sp=poly.map(p=>surfPt(c.surf,p[0],p[1]));
  cx.save();cx.lineJoin='miter';cx.lineCap='butt';
  const cw=2.2*(1-persp(B.t)*.6);
  cx.strokeStyle=sc(B.t,.16*fade);cx.lineWidth=cw*4;cx.beginPath();cx.moveTo(sp[0][0],sp[0][1]);for(let i=1;i<sp.length;i++)cx.lineTo(sp[i][0],sp[i][1]);cx.stroke();
  cx.strokeStyle=sc(B.t,.85*fade);cx.lineWidth=cw;
  cx.beginPath();cx.moveTo(sp[0][0],sp[0][1]);for(let i=1;i<sp.length;i++)cx.lineTo(sp[i][0],sp[i][1]);cx.stroke();
  const h=sp[sp.length-1];cx.fillStyle=hc(B.t,fade);cx.beginPath();cx.arc(h[0],h[1],2.6*(1-persp(B.t)*.6),0,7);cx.fill();
  for(let i=1;i<c.pts.length-1;i++){if(c.cum[i]<=d1&&c.cum[i]>=d1-c.L*2.5){const q=surfPt(c.surf,c.pts[i][0],c.pts[i][1]);
   cx.fillStyle=sc(c.pts[i][1],.6*fade);cx.fillRect(q[0]-2,q[1]-2,4,4);}}
  cx.restore();
  if(c.surf==='floor'){cx.strokeStyle=`rgba(58,61,126,${.07*fade})`;cx.lineWidth=3;cx.beginPath();cx.moveTo(sp[0][0]+3,sp[0][1]+5);for(let i=1;i<sp.length;i++)cx.lineTo(sp[i][0]+3,sp[i][1]+5);cx.stroke();}
  if(fade<=0)circuits.splice(n,1);}
}

const EQ=['G_{μν} + Λg_{μν} = (8πG / c^{4}) T_{μν}','H^{2} = (8πG / 3)ρ − kc^{2} / a^{2} + Λc^{2} / 3','iħ ∂Ψ/∂t = ĤΨ','E = mc^{2}',
 'r_{s} = 2GM / c^{2}','ds^{2} = −c^{2}dt^{2} + a(t)^{2}dΣ^{2}','∇·E = ρ / ε_{0}','∇×B = μ_{0}J + μ_{0}ε_{0} ∂E/∂t','Δx Δp ≥ ħ / 2',
 'S = k_{B} ln Ω','T_{H} = ħc^{3} / 8πGMk_{B}','v = H_{0} d','R_{μν} − ½Rg_{μν} = 8πG T_{μν}','λ = h / p','F = G m_{1}m_{2} / r^{2}'];
function parseEq(str){const out=[];let i=0,buf='';
 while(i<str.length){const ch=str[i];
  if((ch==='^'||ch==='_')&&str[i+1]==='{'){if(buf){out.push({t:buf,l:0});buf='';}
   const j=str.indexOf('}',i);out.push({t:str.slice(i+2,j),l:ch==='^'?1:-1});i=j+1;continue;}
  buf+=ch;i++;}
 if(buf)out.push({t:buf,l:0});return out;}
const eqs=[];let eqTimer=0,eqIdx=Math.floor(Math.random()*EQ.length);
function eqFont(sz,l){return `${l?Math.round(sz*0.62):sz}px 'Noto Serif','Times New Roman',serif`;}
function eqWidth(parts,sz){let w=0;for(const p of parts){cx.font=eqFont(sz,p.l);w+=cx.measureText(p.t).width;}return w;}
function spawnEq(){const sz=Math.max(5,Math.min(5.5,W*0.00375));
 const parts=parseEq(EQ[eqIdx]);eqIdx=(eqIdx+1+Math.floor(Math.random()*3))%EQ.length;
 const w=eqWidth(parts,sz);
 for(let k=0;k<24;k++){const x=W*0.56+Math.random()*Math.max(10,W*0.42-w),y=H*0.07+Math.random()*H*0.24;
  if(x+w>W-16)continue;
  if(eqs.every(e=>Math.abs(e.y-y)>sz*1.9||x>e.x+e.w+20||x+w<e.x-20)){eqs.push({parts,sz,x,y,w,age:0,life:RM?3.5:1.73});return;}}
}
// 「動きを減らす」設定では、ゆっくり・少なく出す（濃さは通常と同じく薄く）
function drawEqs(dt){eqTimer-=dt;if(eqTimer<=0&&eqs.length<(RM?8:20)){spawnEq();eqTimer=RM?0.8+Math.random()*0.5:0.067+Math.random()*0.067;}
 for(let n=eqs.length-1;n>=0;n--){const e=eqs[n];e.age+=dt;
  const a=e.age<0.2?e.age/0.2:(e.age>e.life-0.47?Math.max(0,(e.life-e.age)/0.47):1);
  const rev=Math.min(1,e.age/(RM?0.8:0.37));const dy=-e.age*(RM?4:9);
  cx.save();cx.beginPath();cx.rect(e.x-4,e.y+dy-e.sz*1.4,(e.w+8)*rev,e.sz*2.2);cx.clip();
  cx.fillStyle=`rgba(58,61,126,${0.375*a})`;
  let x=e.x;for(const p of e.parts){cx.font=eqFont(e.sz,p.l);const off=p.l===1?-e.sz*0.42:(p.l===-1?e.sz*0.22:0);
   cx.fillText(p.t,x,e.y+dy+off);x+=cx.measureText(p.t).width;}
  if(rev<1){cx.fillStyle=`rgba(251,113,50,${0.45*a})`;cx.fillRect(e.x+(e.w+8)*rev-6,e.y+dy-e.sz*0.9,1.5,e.sz*1.1);}
  cx.restore();if(e.age>=e.life)eqs.splice(n,1);}
}
let phase=0;
function sc(t,a){const O=[251,113,50],N=[55,62,185];let k=phase===0?0:(phase===1?1:Math.min(1,t*1.4));
 const c=O.map((v,i)=>Math.round(lerp(v,N[i],k)));return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function hc(t,a){const O=[255,148,26],N=[55,62,185];let k=phase===0?0:(phase===1?1:Math.min(1,t*1.4));
 const c=O.map((v,i)=>Math.round(lerp(v,N[i],k)));return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
let tm=0;
let heroVis=true,lastT=0,acc=0;
// 画面の書き換えが速い端末でも、描くのは1秒に60回まで（速さも一定に保つ）
function draw(now){now=now||performance.now();acc+=Math.min(now-lastT,100);lastT=now;
 if(!heroVis||acc<16){requestAnimationFrame(draw);return;}acc=Math.min(acc-1000/60,1000/60);tm+=1/60;
 cx.clearRect(0,0,W,H);
 cx.fillStyle=bgG;cx.fillRect(0,0,W,H);
 const flick=0.85+0.15*Math.sin(tm*2.3);
 cx.globalAlpha=flick;
 for(const r of rails){cx.strokeStyle=r.g;cx.lineWidth=r.kind==='seam'?1.4:0.8;cx.beginPath();cx.moveTo(r.x,r.y);cx.lineTo(VP.x,VP.y);cx.stroke();}
 cx.globalAlpha=1;
 const rings=9,shift=(tm*0.06)%1;
 for(let k=0;k<rings;k++){let d=(k+shift)/rings;const t=persp(d);
  const a=0.22*(1-d)*flick;
  const wx=lerp(0,VP.x,t),wt=lerp(-H*0.15,VP.y,t),wb=lerp(H,VP.y,t),fr=lerp(W*1.2,VP.x,t);
  cx.strokeStyle=col(t,a);cx.lineWidth=.8;cx.beginPath();cx.moveTo(wx,wt);cx.lineTo(wx,wb);cx.lineTo(fr,wb);cx.stroke();}
 if(Math.random()<(RM?.045:0.13))spawn();
 for(let i=streaks.length-1;i>=0;i--){const s=streaks[i];s.t+=s.v;const t1=persp(Math.min(s.t,1)),t0=persp(Math.max(s.t-s.len,0));
  const x1=lerp(s.r.x,VP.x,t1),y1=lerp(s.r.y,VP.y,t1),x0=lerp(s.r.x,VP.x,t0),y0=lerp(s.r.y,VP.y,t0);
  const fade=1-Math.min(s.t,1);
  const sg=cx.createLinearGradient(x0,y0,x1,y1);sg.addColorStop(0,sc(t0,0));sg.addColorStop(.8,sc(t1,.75*fade));sg.addColorStop(1,hc(t1,fade));
  // にじみ：ぼかしの影の代わりに、太い半透明の線を下に重ねる（ぼかしの影は描く処理が重いため）
  const lw=3.4*(1-t1*.7);cx.lineCap='round';
  cx.strokeStyle=sc(t1,.12*fade);cx.lineWidth=lw*5;cx.beginPath();cx.moveTo(x0+(x1-x0)*.45,y0+(y1-y0)*.45);cx.lineTo(x1,y1);cx.stroke();
  cx.strokeStyle=sc(t1,.2*fade);cx.lineWidth=lw*2.6;cx.beginPath();cx.moveTo(x0+(x1-x0)*.6,y0+(y1-y0)*.6);cx.lineTo(x1,y1);cx.stroke();
  cx.strokeStyle=sg;cx.lineWidth=lw;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(x1,y1);cx.stroke();cx.lineCap='butt';
  if(s.r.kind==='floor'){cx.strokeStyle=`rgba(58,61,126,${.08*fade})`;cx.lineWidth=3;cx.beginPath();cx.moveTo(x0+3,y0+5);cx.lineTo(x1+3,y1+5);cx.stroke();}
  if(s.t>1.05)streaks.splice(i,1);}
 drawCircuits();
 drawEqs(1/60);
 if(mode==='holo'){cx.fillStyle='rgba(58,61,126,0.018)';for(let y=(tm*20)%4;y<H;y+=4)cx.fillRect(0,y,W,1);}
 requestAnimationFrame(draw);}
window.addEventListener('resize',rs);rs();for(let i=0;i<6;i++){spawn();streaks[streaks.length-1]&&(streaks[streaks.length-1].t=Math.random()*.8);}if(!RM)for(let i=0;i<3;i++){spawnCircuit();circuits[circuits.length-1].head=Math.random()*0.6;}draw();
const TT=[{l:['中小企業専用','基幹システム構築']},{l:['使うシステムから','育てるシステムへ']},{l:['結果を待つ経営から','結果を導く経営へ']}];
const el=document.getElementById('ttl');let ti=0;
function show(i){el.className='';el.style.transform='';el.innerHTML=TT[i].l.join('<br>');void el.offsetWidth;el.className='c'+i+' snap';phase=i;}
function burst(){for(let k=0;k<10;k++){spawn();const s=streaks[streaks.length-1];if(s){s.v*=1.8;}}for(let k=0;k<2;k++)spawnCircuit();}
function cycle(){if(RM){setTimeout(()=>{el.style.opacity='0';setTimeout(()=>{ti=(ti+1)%TT.length;show(ti);el.style.opacity='1';cycle();},800);},7000);return;}
 setTimeout(()=>{const r=el.getBoundingClientRect(),hr=document.getElementById('hero').getBoundingClientRect();const dx=VP.x-(r.left-hr.left+r.width/2),dy=VP.y-(r.top-hr.top+r.height/2);
 el.classList.remove('snap');void el.offsetWidth;el.classList.add('suck');el.style.transform=`translate(${dx}px,${dy}px) scale(.03)`;
 ti=(ti+1)%TT.length;setTimeout(()=>{phase=ti;burst();},350);
 setTimeout(()=>{show(ti);cycle();},950);},7000);}
show(0);cycle();

// ---- page behaviours ----
const hdr=document.getElementById('hdr');
addEventListener('scroll',()=>hdr.classList.toggle('solid',scrollY>40),{passive:true});
new IntersectionObserver(es=>{heroVis=es[0].isIntersecting;},{threshold:0}).observe(document.getElementById('hero'));
// 説明の絵（SVGの動き）は、設定がオンなら半分の速さにする
if(RM)document.querySelectorAll('animate,animateMotion,set').forEach(a=>{
 const d=a.getAttribute('dur');if(d&&d.endsWith('s'))a.setAttribute('dur',(parseFloat(d)*2)+'s');
 const b=a.getAttribute('begin');if(b)a.setAttribute('begin',b.replace(/\+([\d.]+)s/,(m,x)=>'+'+(parseFloat(x)*2)+'s'));});
const started=new Set();
function startAnim(id){const a=document.getElementById(id);if(a&&!started.has(id)&&a.beginElement){started.add(id);a.beginElement();}}
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');
  e.target.querySelectorAll&&e.target.querySelectorAll('animateMotion').forEach(m=>startAnim(m.id));
  if(e.target.querySelector&&e.target.querySelector('#gridcv'))gridStart();io.unobserve(e.target);}});},{threshold:0,rootMargin:'0px 0px -15% 0px'});
document.querySelectorAll('.rv').forEach(x=>io.observe(x));

// ---- cells -> JSON -> threads ----
const gc=document.getElementById('gridcv'),gx=gc.getContext('2d');let gW,gH,gStart=null;
function gResize(){const d=Math.min(devicePixelRatio||1,2);gW=gc.clientWidth;gH=gc.clientHeight;gc.width=gW*d;gc.height=gH*d;gx.setTransform(d,0,0,d,0,0);}
gResize();addEventListener('resize',gResize);
function gridStart(){if(gStart===null){gStart=performance.now();requestAnimationFrame(gDraw);}}
const GC=8,GR=5,TH=0.98,MONO="'Menlo','Consolas','Noto Sans Mono','Noto Sans JP',monospace";
function gp(x,r){const y=r*Math.cos(TH),z=r*Math.sin(TH),D=7,f=Math.min(gW*0.95,gH*1.35);return [gW/2+f*x/(D+z),gH*0.99-f*y/(D+z),f/(D+z)];}
const ROWSD=[['timeStamp','"2026-10-12T21:52:09"','21:52:09',0,4],['customerName','"A Trading"','A Trading',2,4],['customerId','"C-1024"','C-1024',5,4],
 ['purchaseName','"B Supply"','B Supply',1,3],['purchaseId','"P-0381"','P-0381',6,3],['quantity','48','48',3,2],['unitPrice','1200','1,200',4,2],
 ['totalAmount','57600','57,600',7,2],['uniqueId','"20261012215209_19"','#19',0,1],['storageName','"Main WH"','Main WH',3,1],['productName','"Item A"','Item A',5,0]];
const NOISE=[[1,0,'C-0877'],[7,0,'2,400'],[2,1,'P-0112'],[6,1,'12'],[0,2,'B Corp'],[6,4,'09:14'],[3,3,'Item C'],[7,3,'96']];
const ease=x=>x<0?0:x>1?1:1-Math.pow(1-x,3), easeIn=x=>x<0?0:x>1?1:x*x*x;
const CYC=8.4;
function lerpC(a,b,k){return a.map((v,i)=>Math.round(v+(b[i]-v)*k));}
const NAVY=[58,61,126],OR=[251,113,50],BL=[55,62,185];
function jsonLayout(){const fs=Math.max(5.5,Math.min(7,gW*0.013));gx.font=`${fs}px ${MONO}`;
 const lines=['{'].concat(ROWSD.map((r,i)=>`  "${r[0]}": ${r[1]}${i<ROWSD.length-1?',':''}`)).concat(['}']);
 const w=Math.max(...lines.map(l=>gx.measureText(l).width));const lh=fs*1.6;const x0=gW/2-w/2,y0=gH*0.1;
 return {fs,lh,x0,y0,lines};}
function lineTimes(li){const n=ROWSD.length;
 if(li===0)return {rise:0.3,arr:0.5,suck:0.5+1.05};
 if(li===n+1){const a=0.5+(n-1)*0.25+1.1;return {rise:a,arr:a,suck:a+1.0};}
 const rise=0.5+(li-1)*0.25,arr=rise+1.1;return {rise,arr,suck:arr+1.0};}
const lineParts={};let lastCyc=-1;
function buildLine(L,li){const ps=[];gx.font=`${L.fs}px ${MONO}`;let x=L.x0;
 for(const ch of L.lines[li]){const w=gx.measureText(ch).width;if(ch!==' ')ps.push({ch,x0:x,y0:L.y0+li*L.lh,lane:(Math.random()-.5)*10,delay:Math.random()*0.3});x+=w;}return ps;}
function bez(p0,p1,p2,p3,t){const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;}
let gVis=true,gLast=0;
new IntersectionObserver(es=>{gVis=es[0].isIntersecting;},{threshold:0}).observe(gc);
// 画面の外にある間は描かない。描くのは1秒に60回まで
function gDraw(now){if(!gVis||now-gLast<15){requestAnimationFrame(gDraw);return;}gLast=now;const T=(now-gStart)/1000*(RM?.5:1),cyc=Math.floor(T/CYC),c=T%CYC;gx.clearRect(0,0,gW,gH);
 if(cyc!==lastCyc){for(const k in lineParts)delete lineParts[k];lastCyc=cyc;}
 const hw=GC/2;
 for(let i=0;i<=GC;i++){const a=gp(-hw+i,0),b=gp(-hw+i,GR);const g=gx.createLinearGradient(a[0],a[1],b[0],b[1]);g.addColorStop(0,'rgba(255,148,26,.55)');g.addColorStop(1,'rgba(255,148,26,.05)');gx.strokeStyle=g;gx.lineWidth=1;gx.beginPath();gx.moveTo(a[0],a[1]);gx.lineTo(b[0],b[1]);gx.stroke();}
 for(let r=0;r<=GR;r++){const a=gp(-hw,r),b=gp(hw,r);gx.strokeStyle=`rgba(255,148,26,${.5-r*.09})`;gx.beginPath();gx.moveTo(a[0],a[1]);gx.lineTo(b[0],b[1]);gx.stroke();}
 gx.textAlign='center';gx.textBaseline='middle';
 for(const [cc,rr,v] of NOISE){const p=gp(-hw+cc+.5,rr+.5);gx.font=`${Math.max(4.5,p[2]*0.055)}px ${MONO}`;gx.fillStyle=`rgba(58,61,126,${.24-rr*.03})`;gx.fillText(v,p[0],p[1]);}
 const L=jsonLayout();const tx=gW/2;let anySuck=false;
 for(let li=0;li<L.lines.length;li++){const tm=lineTimes(li);const ly=L.y0+li*L.lh;
  if(c>=tm.suck){anySuck=true;if(!lineParts[li])lineParts[li]=buildLine(L,li);
   gx.font=`${L.fs}px ${MONO}`;gx.textAlign='left';gx.textBaseline='alphabetic';const ks=c-tm.suck;
   for(const p of lineParts[li]){const u=(ks-p.delay)/1.4;
    if(u<=0){gx.fillStyle='rgba(58,61,126,.95)';gx.fillText(p.ch,p.x0,p.y0);continue;}
    if(u>1.2)continue;
    const pos=s=>{s=Math.max(0,Math.min(1,s));const e=easeIn(s);return [bez(p.x0,p.x0,tx+p.lane,tx+p.lane*.3,e),bez(p.y0,p.y0-30,gH*0.05,-30,e)];};
    const a=pos(u),b=pos(u-0.18);
    if(u<0.25){gx.fillStyle=`rgba(58,61,126,${.95*(1-u/0.25)})`;gx.fillText(p.ch,a[0],a[1]);}
    const col=u<0.5?lerpC(NAVY,OR,u/0.5):lerpC(OR,BL,(u-0.5)/0.5);
    gx.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},${Math.min(1,u*3)*(u>1?Math.max(0,1-(u-1)*5):1)*.8})`;gx.lineWidth=0.7;
    gx.beginPath();gx.moveTo(b[0],b[1]);gx.lineTo(a[0],a[1]);gx.stroke();}
   continue;}
  if(li===0||li===L.lines.length-1){if(c>=tm.arr){gx.font=`${L.fs}px ${MONO}`;gx.textAlign='left';gx.textBaseline='alphabetic';
    gx.fillStyle=`rgba(58,61,126,${.9*ease((c-tm.arr)/0.3)})`;gx.fillText(L.lines[li],L.x0,ly);}continue;}
  const r=ROWSD[li-1];const cell=gp(-hw+r[3]+.5,r[4]+.5);
  gx.font=`${L.fs}px ${MONO}`;const keyStr=`  "${r[0]}": `,kw=gx.measureText(keyStr).width;const vx=L.x0+kw;
  const k=ease((c-tm.rise)/1.1);const kIn=ease(c/0.5);
  const x=cell[0]+(vx-cell[0])*k,y=cell[1]+(ly-cell[1])*k-Math.sin(k*Math.PI)*20;
  const fs0=Math.max(5,cell[2]*0.065),fs=fs0+(L.fs-fs0)*k;
  if(k>0&&k<1){gx.strokeStyle=`rgba(251,113,50,${.35*(1-k)})`;gx.lineWidth=0.8;gx.beginPath();gx.moveTo(cell[0],cell[1]);gx.lineTo(x,y);gx.stroke();}
  const early=k<0.6;gx.font=`${fs}px ${MONO}`;gx.textAlign=early?'center':'left';gx.textBaseline=early?'middle':'alphabetic';
  gx.fillStyle=early?`rgba(251,113,50,${kIn})`:'rgba(58,61,126,.95)';gx.fillText(early?r[2]:r[1],x,y);
  if(c>=tm.arr){const kk=ease((c-tm.arr)/0.4);gx.textAlign='left';gx.textBaseline='alphabetic';gx.font=`${L.fs}px ${MONO}`;
   gx.fillStyle=`rgba(55,62,185,${.85*kk})`;gx.fillText(keyStr,L.x0,ly);
   if(li<ROWSD.length){const vw=gx.measureText(r[1]).width;gx.fillStyle=`rgba(58,61,126,${kk})`;gx.fillText(',',vx+vw,ly);}}
 }
 if(anySuck){const n=5;for(let k=0;k<n;k++){const ph=((c*1.6+k/n)%1);const y=gH*0.06-ph*gH*0.1;const x=tx+(k-2)*2.5;
  gx.fillStyle=`rgba(251,113,50,${.7*(1-ph)})`;gx.fillRect(x-0.5,y,1,8);}}
 requestAnimationFrame(gDraw);}
