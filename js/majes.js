// MAJES 呼び出しタブと対面画面（全ページ共通。サーバーを持たないので、会話は訪問中だけ sessionStorage に保持）
(function(){
 // 接続先（MAJES 側の窓口ができたら endpoint を入れる。空の間は「準備中」の返事を出す）
 const CFG={endpoint:'',line:'',topic:document.body.dataset.majesTopic||'',tel:'0940-22-8558'};
 const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const KEY='majes';
 const GREET='株式会社エネックスの MAJES です。基幹システムの導入や費用の目安、エネックスの電気など、お気軽にお尋ねください。御社の状況に沿った詳しいご相談は、LINE で承ります。';
 const LINE_MSG='もっと詳しくお話しされる場合は、LINE の友だち登録をお願いします。登録いただくと相談者さまを認識・記憶し、次回以降も続きからお話しできます。登録後にお名前・電話番号・ご住所を伺ったうえで、ご相談の段階に合わせて詳しくご案内します。';
 const PREP='ただいま窓口を準備中です。お急ぎの場合はお電話（'+CFG.tel+'）でお尋ねください。';

 // 訪問中の記録（無作為の番号・会話・開閉）
 let S;
 try{S=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(e){S=null;}
 if(!S||!S.sid)S={sid:Math.random().toString(36).slice(2)+Date.now().toString(36),open:false,msgs:[],line:false};
 const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};

 // 案内役：いただいた絵をコマ（200×140、5列）に切った線画の表を、3枚ずらして重ねて立体に見せる
 //  idle = 静かに立っている20コマ、talk = 手ぶりの40コマ（5コマで1つの手ぶり、8種類）
 const SHEET={idle:{src:'assets/majes-idle.png?v=20261013s',n:20},talk:{src:'assets/majes-talk.png?v=20261013s',n:40}};
 // 周りに浮かべる小さな形（点・輪・線・角）。位置・大きさ・速さは毎回無作為
 let bits='';
 for(let i=0;i<16;i++){
  const k=['dot','dot','ring','dash','sq'][i%5],s=(2+Math.random()*4).toFixed(1);
  bits+='<i class="'+k+'" style="--x:'+(Math.random()*100).toFixed(0)+'%;--y:'+(20+Math.random()*80).toFixed(0)+'%;--s:'+s+'px;--d:'+(3.5+Math.random()*5).toFixed(1)+'s;--dl:-'+(Math.random()*8).toFixed(1)+'s;--mx:'+(-14+Math.random()*28).toFixed(0)+'px"></i>';
 }
 const HOLO='<div class="mj-holo sp'+(RM?' rm':'')+'"><div class="base"></div><div class="bits">'+bits+'</div>'
  +'<div class="figwrap"><div class="ly a"></div><div class="ly b"></div><div class="ly c"></div></div>'
  +'<div class="wave"><i></i><i></i><i></i></div><div class="scan"></div></div>';

 // 画面の組み立て
 const tab=document.createElement('button');
 tab.className='mj-tab';tab.type='button';tab.setAttribute('aria-controls','mj-panel');
 tab.innerHTML='<i></i>Call MAJES';
 const p=document.createElement('aside');
 p.className='mj-panel';p.id='mj-panel';p.setAttribute('aria-label','MAJES 相談窓口');
 p.innerHTML='<div class="mj-head">'+HOLO+'<div class="mj-name">agentMAJES<small>フロントアドバイザー</small></div><button type="button" class="mj-close" aria-label="閉じる">×</button></div>'
  +'<div class="mj-log" aria-live="polite"></div>'
  +'<div class="mj-line" hidden><p></p><a class="mj-linebtn" target="_blank" rel="noopener">LINE で友だち登録</a></div>'
  +'<form class="mj-form"><input type="text" autocomplete="off" maxlength="300" placeholder="ご質問をどうぞ" aria-label="ご質問"><button type="submit">送る</button></form>'
  +'<p class="mj-note">この会話はブラウザを閉じるまで保持されます。お名前や連絡先は入力せず、詳しいご相談は LINE でお願いします。</p>';
 document.body.append(tab,p);
 const log=p.querySelector('.mj-log'),form=p.querySelector('.mj-form'),inp=form.querySelector('input'),holo=p.querySelector('.mj-holo'),lineBox=p.querySelector('.mj-line');
 lineBox.querySelector('p').textContent=LINE_MSG;
 const lineBtn=lineBox.querySelector('.mj-linebtn');
 if(CFG.line)lineBtn.href=CFG.line;else{lineBtn.removeAttribute('href');lineBtn.classList.add('soon');lineBtn.textContent='LINE 友だち登録（準備中）';}

 // 吹き出し
 function bubble(role,text,store){
  const d=document.createElement('div');d.className='mj-m '+role;d.textContent=text;log.append(d);
  log.scrollTop=log.scrollHeight;
  if(store){S.msgs.push({r:role,t:text});if(S.msgs.length>60)S.msgs=S.msgs.slice(-60);save();}
  return d;
 }
 function showLine(){lineBox.hidden=false;S.line=true;save();log.scrollTop=log.scrollHeight;}
 S.msgs.forEach(m=>bubble(m.r,m.t,false));
 if(S.line)lineBox.hidden=false;

 // コマ送り：普段は idle を静かに繰り返し、話している間は手ぶり（5コマ）を無作為に選んで行き来する
 const fw=holo.querySelector('.figwrap');
 let mode='idle',fi=0,seq=null,talking=false,talkT;
 function setFrame(sheet,i){fw.dataset.sheet=sheet;holo.style.setProperty('--fx',i%5);holo.style.setProperty('--fy',Math.floor(i/5));}
 function glitch(){holo.classList.add('glitch');setTimeout(()=>holo.classList.remove('glitch'),180);}
 function step(){
  let wait=RM?440:220;
  if(mode==='idle'){
   fi=(fi+1)%SHEET.idle.n;setFrame('idle',fi);
   if(talking){mode='talk';seq={row:Math.floor(Math.random()*8),k:0,dir:1};glitch();}
  }else{
   const f=seq.row*5+seq.k;setFrame('talk',f);wait=RM?300:150;
   if(seq.dir>0&&seq.k===4){wait=500+Math.random()*700;seq.dir=-1;}            // 手を上げ切ったら少し保つ
   else if(seq.dir<0&&seq.k===0){                                            // 手を戻し終えたら次へ
    if(talking){seq={row:Math.floor(Math.random()*8),k:0,dir:1};wait=200+Math.random()*500;glitch();}
    else{mode='idle';glitch();}
   }
   else seq.k+=seq.dir;
  }
  setTimeout(step,wait);
 }
 setFrame('idle',0);step();
 function talk(ms){talking=true;holo.classList.add('talk');clearTimeout(talkT);talkT=setTimeout(()=>{talking=false;holo.classList.remove('talk');},ms);}

 // 開閉
 function open(anim){
  if(anim===false)p.classList.add('noanim');
  document.body.classList.add('mj-open');p.classList.add('open');tab.setAttribute('aria-expanded','true');
  S.open=true;save();
  if(!S.msgs.length){setTimeout(()=>{bubble('a',GREET,true);talk(3000);},anim===false?0:450);}
  requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.remove('noanim')));
 }
 function close(){document.body.classList.remove('mj-open');p.classList.remove('open');tab.setAttribute('aria-expanded','false');S.open=false;save();}
 tab.addEventListener('click',()=>open());
 p.querySelector('.mj-close').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&p.classList.contains('open'))close();});
 if(S.open)open(false);

 // 送信（MAJES の窓口へ。窓口が無い間は準備中の返事）
 let busy=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const t=inp.value.trim();if(!t||busy)return;
  inp.value='';bubble('u',t,true);busy=true;
  const w=bubble('a wait','');w.innerHTML='<i></i><i></i><i></i>';
  let reply=PREP,line=false;
  if(CFG.endpoint){
   try{
    const r=await fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:S.sid,topic:CFG.topic,message:t,page:location.pathname})});
    if(r.ok){const j=await r.json();reply=j.reply||PREP;line=!!j.suggest_line;}
   }catch(err){}
  }else{await new Promise(r=>setTimeout(r,700));line=true;}
  w.remove();bubble('a',reply,true);talk(Math.min(6000,1500+reply.length*60));
  if(line&&lineBox.hidden)showLine();
  busy=false;inp.focus();
 });
})();
