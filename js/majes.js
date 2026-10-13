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

 // ホログラム風の案内役（線で描いた女性のシルエットを3枚重ねて立体に見せる）
 const FIG='<g class="fig">'
  +'<g class="head"><path class="hair" d="M74 80C64 50 78 24 100 24c22 0 36 26 26 56c3 8-1 12-4 14M74 80c-3 8 1 12 4 14"/>'
  +'<path class="face" d="M83 48c-1 22 6 36 17 38c11-2 18-16 17-38"/>'
  +'<path class="bang" d="M80 50c7-9 19-12 32-7"/></g>'
  +'<path d="M94 86l-1 14M106 86l1 14"/>'
  +'<path class="body" d="M50 152c2-32 20-46 43-52l7 7l7-7c23 6 41 20 43 52v62H50z"/>'
  +'<path d="M93 100l7 26l7-26"/>'
  +'<path class="pin" d="M121 128l3-3l3 3l-3 3z"/>'
  +'<g class="arm l"><path d="M64 112c-6 14-9 30-8 48"/><g class="fore l"><path d="M56 160c6 8 14 14 24 16"/><path class="hand" d="M80 176c3-1 6 0 8 2c0 3-2 5-5 5c-3 0-5-2-6-4M82 178l4-3M85 179l4-2M87 181l3-1"/></g></g>'
  +'<g class="arm r"><path d="M136 112c6 14 9 30 8 48"/><g class="fore r"><path d="M144 160c-6 8-14 14-24 16"/><path class="hand" d="M120 176c-3-1-6 0-8 2c0 3 2 5 5 5c3 0 5-2 6-4M118 178l-4-3M115 179l-4-2M113 181l-3-1"/></g></g>'
  +'</g>';
 // 案内役の絵：画像（線だけの透明PNG）があればそれを3枚重ね、無ければ線のSVG
 const IMG='assets/majes-holo.png?v=20261013s';
 // 周りに浮かべる小さな形（点・輪・線・角）。位置・大きさ・速さは毎回無作為
 let bits='';
 for(let i=0;i<16;i++){
  const k=['dot','dot','ring','dash','sq'][i%5],s=(2+Math.random()*4).toFixed(1);
  bits+='<i class="'+k+'" style="--x:'+(Math.random()*100).toFixed(0)+'%;--y:'+(20+Math.random()*80).toFixed(0)+'%;--s:'+s+'px;--d:'+(3.5+Math.random()*5).toFixed(1)+'s;--dl:-'+(Math.random()*8).toFixed(1)+'s;--mx:'+(-14+Math.random()*28).toFixed(0)+'px"></i>';
 }
 const HOLO=IMG
  ?'<div class="mj-holo img'+(RM?' rm':'')+'"><div class="base"></div><div class="bits">'+bits+'</div>'
   +'<div class="figwrap"><img class="ly a" src="'+IMG+'" alt=""><img class="ly b" src="'+IMG+'" alt=""><img class="ly c" src="'+IMG+'" alt=""></div>'
   +'<div class="wave"><i></i><i></i><i></i></div><div class="scan"></div></div>'
  :'<div class="mj-holo'+(RM?' rm':'')+'"><div class="base"></div>'
   +'<svg viewBox="0 0 200 214" aria-hidden="true">'
   +'<g class="ly a">'+FIG+'</g><g class="ly b">'+FIG+'</g><g class="ly c">'+FIG+'</g>'
   +'</svg><div class="scan"></div></div>';

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

 // 話している合図（返事が出ている間だけ手ぶりを速める）
 let talkT;
 function talk(ms){holo.classList.add('talk');clearTimeout(talkT);talkT=setTimeout(()=>holo.classList.remove('talk'),ms);}

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
