// AIエージェントのページの動く絵。線画はトップと同じ作法（薄いオレンジ／薄い紺、細い線）
(function(){
 const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;const spd=RM?.5:1;
 function setup(c){const x=c.getContext('2d');let W,H;const rs=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);};rs();addEventListener('resize',rs);return {x,get W(){return W},get H(){return H}};}
 function visible(c,fn){let on=false,started=false;new IntersectionObserver(e=>{on=e[0].isIntersecting;if(on&&!started){started=true;requestAnimationFrame(fn);}},{threshold:0}).observe(c);return ()=>on;}
 const PSV=n=>{const one=()=>['∂∫'+Math.floor(Math.random()*1e6),'USER','NORM','UNKNOWN','RLX','00'+Math.floor(Math.random()*9)+'$','STD','#'+['取引','在庫','請求','入金','納品','発注'][Math.floor(Math.random()*6)],'...',String(260000+Math.floor(Math.random()*99999)),['CHT','PRO','KNO','BAS'][Math.floor(Math.random()*4)],'...'].join('|');let t='';while(t.length<n)t+=one()+'|';return t.slice(0,n);};

 // ---- 1. ダイヤモンドのホログラム（箱の後ろに重ねる。線は薄く）＋ PSV の出入り ----
 const hc=document.getElementById('holocv');
 if(hc){
  const g=setup(hc);const x=g.x;let t=0,last=0;
  const ring=(n,r,y,ph)=>Array.from({length:n},(_,i)=>{const a=ph+i*Math.PI*2/n;return [Math.cos(a)*r,y,Math.sin(a)*r];});
  const streams=[];
  const spawn=()=>{if(streams.length>7)return;const out=Math.random()<.3;streams.push({s:0,ang:out?-Math.PI/4+(Math.random()-.5)*.3:Math.random()*Math.PI*2,out,txt:PSV(90+Math.floor(Math.random()*60)),v:(.08+Math.random()*.06)*spd});};
  const isOn=visible(hc,draw);
  function draw(now){if(!isOn()){requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.1);last=now;t+=dt*spd;
   const W=g.W,H=g.H,cx=W/2+W*.05,cy=H*.5,R=Math.min(W*.38,H*.5);x.clearRect(0,0,W,H);
   const ay=t*.45,ax=.42,tilt=.5;
   const pr=([px,py,pz])=>{let X=px*Math.cos(ay)-pz*Math.sin(ay),Z=px*Math.sin(ay)+pz*Math.cos(ay);let Y=py*Math.cos(ax)-Z*Math.sin(ax);Z=py*Math.sin(ax)+Z*Math.cos(ax);const X2=X*Math.cos(tilt)-Y*Math.sin(tilt),Y2=X*Math.sin(tilt)+Y*Math.cos(tilt);const f=1/(1+Z*.18);return [cx+X2*R*f,cy+Y2*R*f*.9,Z];};
   const C=ring(8,.55,-.55,0).map(pr),G=ring(8,1,0,Math.PI/8).map(pr),T=pr([0,-1,0]),B=pr([0,1.25,0]);
   const line=(a,b,al)=>{x.strokeStyle=`rgba(58,61,126,${al*.5})`;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();};
   x.lineWidth=.5;
   for(let i=0;i<8;i++){const j=(i+1)%8;const dep=(C[i][2]+C[j][2])/2;const al=.18+(.3-dep*.12);line(C[i],C[j],al);line(G[i],G[j],.2+(.3-(G[i][2]+G[j][2])/2*.12));line(T,C[i],al*.9);line(C[i],G[i],al);line(C[i],G[j],al*.7);line(G[i],B,.22);}
   const gr=x.createRadialGradient(cx,cy,0,cx,cy,R*.5);gr.addColorStop(0,'rgba(55,62,185,.05)');gr.addColorStop(1,'rgba(55,62,185,0)');x.fillStyle=gr;x.fillRect(cx-R,cy-R,R*2,R*2);
   if(Math.random()<.04*spd)spawn();
   x.font='7px Menlo,Consolas,monospace';x.textBaseline='middle';
   for(let i=streams.length-1;i>=0;i--){const s=streams[i];s.s+=s.v*dt*2.2;if(s.s>1){streams.splice(i,1);continue;}
    const L=R*1.15;const u=s.out?s.s:1-s.s;const px=cx+Math.cos(s.ang)*L*u,py=cy+Math.sin(s.ang)*L*u*.8;const al=s.out?(1-s.s)*.2:s.s*.16;
    x.save();x.translate(px,py);x.rotate(s.ang+(s.out?0:Math.PI));x.fillStyle=`rgba(255,148,26,${al})`;x.fillText(s.txt,0,0);x.restore();
    x.strokeStyle=`rgba(255,148,26,${al*.5})`;x.lineWidth=.6;x.beginPath();x.moveTo(cx+Math.cos(s.ang)*R*.2,cy+Math.sin(s.ang)*R*.2*.8);x.lineTo(px,py);x.stroke();}
   requestAnimationFrame(draw);}
 }

 // ---- 2. PSV の雨：細い長い行が 1 行ずつゆっくり降り、15〜25 行積もったら静かに消え、また降る ----
 const pc=document.getElementById('psvcv');
 if(pc){
  const g=setup(pc);const x=g.x;let last=0,next=0;const LH=9;
  const falling=[],pile=[];let fading=false,fade=1,target=15+Math.floor(Math.random()*11),primed=false;
  const isOn=visible(pc,draw);
  function draw(now){if(!isOn()){requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.1);last=now;const W=g.W,H=g.H;x.clearRect(0,0,W,H);
   x.font='5px Menlo,Consolas,monospace';x.textBaseline='top';
   if(!primed){primed=true;for(let k=0;k<4;k++){const full=k%2===0;pile.push({txt:PSV(full?Math.floor(W/3.1):Math.floor(W/6.2)),x:full?8:(k%4===1?8:W/2)});}}
   if(!fading){next-=dt*spd;if(next<=0&&falling.length<3){const full=Math.random()<.5;const len=full?Math.floor(W/3.1):Math.floor(W/6.2);const px=full?8:(Math.random()<.5?8:W/2);falling.push({txt:PSV(len),x:px,y:-10,v:(34+Math.random()*12)*spd});next=.7+Math.random()*.5;}}
   const stackTop=H-10-pile.length*LH;
   for(let i=falling.length-1;i>=0;i--){const f=falling[i];f.y+=f.v*dt;if(f.y>=stackTop-LH){pile.push({txt:f.txt,x:f.x});falling.splice(i,1);continue;}x.fillStyle='rgba(0,0,0,.4)';x.fillText(f.txt,f.x,f.y);}
   if(pile.length>=target&&!fading){fading=true;}
   if(fading){fade-=.25*dt*spd;if(fade<=0){pile.length=0;fading=false;fade=1;target=15+Math.floor(Math.random()*11);next=.6;}}
   x.fillStyle=`rgba(0,0,0,${.4*fade})`;pile.forEach((p,i)=>x.fillText(p.txt,p.x,H-10-(pile.length-i)*LH));
   requestAnimationFrame(draw);}
 }
})();
