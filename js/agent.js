// AIエージェントのページの動く絵（2つ）。線画はトップと同じ作法（薄いオレンジ／薄い紺、細い線）
(function(){
 const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const spd=RM?.5:1;
 function setup(c){const x=c.getContext('2d');let W,H;const rs=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);};rs();addEventListener('resize',rs);return {x,get W(){return W},get H(){return H}};}
 function visible(c,fn){let on=false,started=false;new IntersectionObserver(e=>{on=e[0].isIntersecting;if(on&&!started){started=true;requestAnimationFrame(fn);}},{threshold:0}).observe(c);return ()=>on;}

 // ---- 1. ダイヤモンドカットのホログラム（薄い紺の線）＋ PSV データの出入り ----
 const hc=document.getElementById('holocv');
 if(hc){
  const g=setup(hc);const x=g.x;let t=0,last=0;
  // 頂点：上の冠（8角）、腰（8角・大）、下の尖端
  const ring=(n,r,y,ph)=>Array.from({length:n},(_,i)=>{const a=ph+i*Math.PI*2/n;return [Math.cos(a)*r,y,Math.sin(a)*r];});
  const P=()=>{const top=[[0,-1.0,0]],crown=ring(8,.55,-.55,0),girdle=ring(8,1,0,Math.PI/8),tip=[[0,1.25,0]];return {top,crown,girdle,tip};};
  const PSV=()=>{const k=['∂∫'+Math.floor(Math.random()*1e6),'USER','NORM','UNKNOWN','RLX','00'+Math.floor(Math.random()*9)+'$','STD','#'+['取引','在庫','請求','入金'][Math.floor(Math.random()*4)],'...',String(260000+Math.floor(Math.random()*99999)),'CHT','...'];return k.join('|');};
  const streams=[];// {s:0..1, ang, out:bool, txt}
  const spawn=()=>{if(streams.length>7)return;const out=Math.random()<.3;streams.push({s:0,ang:out?-Math.PI/4+(Math.random()-.5)*.3:Math.random()*Math.PI*2,out,txt:PSV(),v:(.08+Math.random()*.06)*spd});};
  const isOn=visible(hc,draw);
  function draw(now){if(!isOn()){requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.1);last=now;t+=dt*spd;
   const W=g.W,H=g.H,cx=W/2,cy=H/2,R=Math.min(W,H)*.32;x.clearRect(0,0,W,H);
   const ay=t*.6,ax=.42;const pr=([px,py,pz])=>{let X=px*Math.cos(ay)-pz*Math.sin(ay),Z=px*Math.sin(ay)+pz*Math.cos(ay);let Y=py*Math.cos(ax)-Z*Math.sin(ax);Z=py*Math.sin(ax)+Z*Math.cos(ax);const f=1/(1+Z*.18);return [cx+X*R*f,cy+Y*R*f*.9,Z];};
   const {top,crown,girdle,tip}=P();const C=crown.map(pr),G=girdle.map(pr),T=pr(top[0]),B=pr(tip[0]);
   const line=(a,b,al)=>{x.strokeStyle=`rgba(58,61,126,${al})`;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();};
   x.lineWidth=1;
   for(let i=0;i<8;i++){const j=(i+1)%8;const dep=(C[i][2]+C[j][2])/2;const al=.18+(.3-dep*.12);line(C[i],C[j],al);line(G[i],G[j],.2+(.3-(G[i][2]+G[j][2])/2*.12));line(T,C[i],al*.9);line(C[i],G[i],al);line(C[i],G[j],al*.7);line(G[i],B,.22);}
   // 中心の淡い光
   const gr=x.createRadialGradient(cx,cy,0,cx,cy,R*.5);gr.addColorStop(0,'rgba(55,62,185,.10)');gr.addColorStop(1,'rgba(55,62,185,0)');x.fillStyle=gr;x.fillRect(cx-R,cy-R,R*2,R*2);
   // PSV の流れ（読めない細さ）
   if(Math.random()<.04*spd)spawn();
   x.font='7px Menlo,Consolas,monospace';x.textBaseline='middle';
   for(let i=streams.length-1;i>=0;i--){const s=streams[i];s.s+=s.v*dt*2.2;if(s.s>1){streams.splice(i,1);continue;}
    const L=R*1.9;const u=s.out?s.s:1-s.s;const px=cx+Math.cos(s.ang)*L*u,py=cy+Math.sin(s.ang)*L*u*.8;const al=s.out?(1-s.s)*.22:s.s*.18;
    x.save();x.translate(px,py);x.rotate(s.ang+(s.out?0:Math.PI));x.fillStyle=`rgba(255,148,26,${al})`;x.fillText(s.txt,0,0);x.restore();
    x.strokeStyle=`rgba(255,148,26,${al*.5})`;x.lineWidth=.6;x.beginPath();x.moveTo(cx+Math.cos(s.ang)*R*.2,cy+Math.sin(s.ang)*R*.2*.8);x.lineTo(px,py);x.stroke();}
   requestAnimationFrame(draw);}
 }

 // ---- 2. JSON の雨（グレー 40%、小さい文字）：上から積み重なり、溜まったら左右へすっと消える ----
 const jc=document.getElementById('jsoncv');
 if(jc){
  const g=setup(jc);const x=g.x;let last=0,acc=0;
  const KEYS=['timeStamp','customerName','customerId','purchaseName','quantity','unitPrice','totalAmount','uniqueId','storageName','productName','dueDate','status'];
  const VAL=k=>k==='timeStamp'?`"2026-10-${10+Math.floor(Math.random()*20)}T${String(8+Math.floor(Math.random()*10)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}"`:/Id$/.test(k)?`"${['C','P','S'][Math.floor(Math.random()*3)]}-${1000+Math.floor(Math.random()*9000)}"`:/Name$/.test(k)?`"${['A Trading','B Supply','Main WH','Item '+String.fromCharCode(65+Math.floor(Math.random()*6))][Math.floor(Math.random()*4)]}"`:k==='status'?`"${['ok','pending','done'][Math.floor(Math.random()*3)]}"`:String(Math.floor(Math.random()*90000));
  const mk=()=>{const n=3+Math.floor(Math.random()*3);const ks=[...KEYS].sort(()=>Math.random()-.5).slice(0,n);return ['{',...ks.map((k,i)=>`  "${k}": ${VAL(k)}${i<n-1?',':''}`),'}'];};
  const falling=[],pile=[];// falling: {lines,y,v}  pile: {text,x,y,out:dir,o}
  let primed=false;
  const LH=14;let next=0;
  const isOn=visible(jc,draw);
  function draw(now){if(!isOn()){requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.1);last=now;const W=g.W,H=g.H;x.clearRect(0,0,W,H);
   x.font='10px Menlo,Consolas,monospace';x.textBaseline='top';
   if(!primed){primed=true;let yy=H-14;for(let b=0;b<3;b++){const ls=mk();const px=W*.12+Math.random()*W*.4;for(let k=ls.length-1;k>=0;k--){yy-=LH;pile.push({text:ls[k],x:px,y:yy,out:0,o:.4});}}}
   next-=dt*spd;if(next<=0&&falling.length<3){falling.push({lines:mk(),y:-80,v:(55+Math.random()*25)*spd,x:W*.12+Math.random()*W*.4});next=1.1+Math.random()*.9;}
   const floor=H-16-pile.length*LH*0;// 積み上がり位置は pile の高さで決める
   let stackTop=H-14-pile.filter(p=>!p.out).length*LH;
   for(let i=falling.length-1;i>=0;i--){const f=falling[i];f.y+=f.v*dt;const h=f.lines.length*LH;
    if(f.y+h>=stackTop){for(let k=f.lines.length-1;k>=0;k--){pile.push({text:f.lines[k],x:f.x,y:stackTop-LH,out:0,o:.4});stackTop-=LH;}falling.splice(i,1);continue;}
    f.lines.forEach((ln,k)=>{x.fillStyle='rgba(0,0,0,.4)';x.fillText(ln,f.x,f.y+k*LH);});}
   // 溜まりすぎたら、一番下の行から左右へそっと消す
   const alive=pile.filter(p=>!p.out);
   if(alive.length>Math.floor((H-60)/LH)){const b=alive[0];b.out=Math.random()<.5?-1:1;}
   if(Math.random()<.35*dt*spd&&alive.length>8){const b=alive[0];if(!b.out)b.out=Math.random()<.5?-1:1;}
   for(let i=pile.length-1;i>=0;i--){const p=pile[i];if(p.out){p.x+=p.out*120*dt*spd;p.o-=.5*dt*spd;if(p.o<=0){pile.splice(i,1);pile.filter(q=>!q.out).forEach(q=>{});continue;}}
    x.fillStyle=`rgba(0,0,0,${p.o})`;x.fillText(p.text,p.x,p.y);}
   // 消えた分だけ全体を下へ詰める
   const st=pile.filter(p=>!p.out);let yy=H-14-st.length*LH;st.forEach(p=>{p.y+= (yy-p.y)*Math.min(1,dt*4);yy+=LH;});
   requestAnimationFrame(draw);}
 }
})();
