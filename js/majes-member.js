// MAJES 会員の窓（LINE で会員登録 → メールのリンクでログイン → 声でも話せる）
// 2026-10-18。会話の上限は LINE と合わせて 1 日 40 往復。声はこの端末で文字にするための音として送り、サーバーでは保存しない。
(function(){
 const API='https://majes-api-427698341897.asia-northeast1.run.app/api/v1/public/pk_JnUNdvuyPfnauPWLMY7DZ7MZlNhsu4Ss';
 const LINE='https://line.me/R/ti/p/@947auqhk';
 const SKEY='majes_member';
 const $=(h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;};
 let M=null;try{M=JSON.parse(localStorage.getItem(SKEY)||'null');}catch(e){}
 if(M&&(!M.token||!M.exp||Date.parse(M.exp)<Date.now()))M=null;
 const saveM=()=>{try{M?localStorage.setItem(SKEY,JSON.stringify(M)):localStorage.removeItem(SKEY);}catch(e){}};

 // ---- 画面 ----
 const box=$('<div class="mjm" role="dialog" aria-modal="true" aria-label="MAJES 会員の窓" hidden>'
  +'<div class="mjm-card">'
  +'<div class="mjm-head"><div><b>agentMAJES</b><small class="mjm-who"></small></div><button type="button" class="mjm-x" aria-label="閉じる">×</button></div>'
  +'<div class="mjm-guide" hidden>'
  +'<p class="mjm-lead">会員の方は、MAJES と声で会話しながらご質問いただけます。</p>'
  +'<ol><li>エネックスの LINE を開きます</li><li>はじめての方は「会員登録」、ご登録済みの方は「ログイン」と送ります</li><li>届いたメールのリンクを開くと、この窓でお話しいただけます</li></ol>'
  +'<a class="mjm-line" href="'+LINE+'" target="_blank" rel="noopener">LINE を開く</a>'
  +'<p class="mjm-small">会話は LINE と合わせて 1 日 40 往復までです。お声は文字にするためだけに使い、保存しません。</p></div>'
  +'<div class="mjm-talk" hidden>'
  +'<div class="mjm-log" aria-live="polite"></div>'
  +'<div class="mjm-status" aria-live="polite">マイクを押して話しかけてください</div>'
  +'<div class="mjm-ctrl"><label class="mjm-call"><input type="checkbox" checked> 続けて話す</label>'
  +'<button type="button" class="mjm-mic" aria-label="話す"><span></span></button>'
  +'<button type="button" class="mjm-stop" aria-label="止める">止める</button></div>'
  +'<form class="mjm-form"><input type="text" maxlength="500" placeholder="文字で送ることもできます" aria-label="ご質問"><button type="submit">送る</button></form>'
  +'</div></div></div>');
 document.body.append(box);
 const who=box.querySelector('.mjm-who'),guide=box.querySelector('.mjm-guide'),talkV=box.querySelector('.mjm-talk'),
  log=box.querySelector('.mjm-log'),st=box.querySelector('.mjm-status'),mic=box.querySelector('.mjm-mic'),
  callChk=box.querySelector('.mjm-call input'),form=box.querySelector('.mjm-form'),inp=form.querySelector('input');
 const bub=(r,t)=>{const d=document.createElement('div');d.className='mjm-m '+r;d.textContent=t;log.append(d);log.scrollTop=log.scrollHeight;return d;};
 const status=(t)=>{st.textContent=t;};
 function show(){
  box.hidden=false;document.body.classList.add('mjm-on');
  if(M){guide.hidden=true;talkV.hidden=false;who.textContent=(M.name||'')+' 様';if(!log.childElementCount)bub('a',(M.name?M.name+'様、':'')+'ようこそ。マイクを押して話しかけてください。LINE でお話しした内容も覚えています。');}
  else{guide.hidden=false;talkV.hidden=true;who.textContent='会員の窓';}
 }
 function hide(){stopAll();box.hidden=true;document.body.classList.remove('mjm-on');}
 box.querySelector('.mjm-x').addEventListener('click',hide);
 box.addEventListener('click',e=>{if(e.target===box)hide();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)hide();});

 // 入口：「LINE 経由で MAJES と音声で質問」ボタン（受付の窓の中と、ページの [data-majes-voice]）
 function addEntry(){
  const faq=document.querySelector('.mj-panel .mj-faq');
  if(faq&&!document.querySelector('.mj-voicebtn')){
   const b=$('<button type="button" class="mj-voicebtn">LINE 経由で MAJES と音声で質問</button>');
   b.addEventListener('click',show);faq.after(b);
  }
  document.querySelectorAll('[data-majes-voice]').forEach(b=>b.addEventListener('click',show));
 }
 addEntry();

 // ---- ログイン（メールのリンク ?majes_member=…）----
 async function api(path,opt){
  const h=Object.assign({},opt&&opt.headers||{});if(M&&M.token)h.Authorization='Bearer '+M.token;
  const r=await fetch(API+path,Object.assign({},opt||{},{headers:h}));
  let j={};try{j=await r.json();}catch(e){}
  if(r.status===401){M=null;saveM();}
  if(!r.ok)throw Object.assign(new Error(j.detail||'通信できませんでした'),{status:r.status});
  return j;
 }
 (async function(){
  const u=new URL(location.href),t=u.searchParams.get('majes_member');
  if(!t)return;
  u.searchParams.delete('majes_member');history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);
  try{
   const j=await api('/member/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t})});
   M={token:j.token,name:j.name,exp:j.expires_at};saveM();show();
  }catch(e){if(M){show();return;}show();guide.querySelector('.mjm-lead').textContent=e.message;}  // ログイン済みならリンクの使い回しでもそのまま開く
 })();

 // ---- 文字で送る ----
 let busy=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const t=inp.value.trim();if(!t||busy)return;inp.value='';
  bub('u',t);await ask(()=>api('/member/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})}),false);
 });
 async function ask(call,speak){
  busy=true;const w=bub('a wait','考えています…');status('考えています…');
  try{
   const j=await call();w.remove();
   if(j.heard!==undefined){if(j.heard)bub('u',j.heard);}
   bub('a',j.reply||'');if(j.notice)bub('a note',j.notice);
   if(j.limit_reached){callChk.checked=false;}
   if(speak&&j.audio){status('お話ししています…');await play(j.audio);}
   status(callChk.checked&&speak&&!j.limit_reached?'続けてどうぞ':'マイクを押して話しかけてください');
   busy=false;
   if(speak&&callChk.checked&&!j.limit_reached&&!box.hidden)listen();
  }catch(e){w.remove();bub('a note',e.status===401?'ログインが切れました。LINE で「ログイン」とお送りください。':e.message);status('マイクを押して話しかけてください');busy=false;if(e.status===401)show();}
 }

 // ---- 声：録る（16kHz の WAV にする）→ 送る → 返事を声で流す ----
 let ac=null,stream=null,node=null,src=null,chunks=[],rec=false,heardVoice=false,lastVoice=0,startAt=0,playing=null;
 function ensureAC(){if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;}
 async function listen(){
  if(rec||busy)return;
  try{
   ensureAC();
   if(!stream)stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  }catch(e){bub('a note','マイクを使えませんでした。ブラウザの設定でマイクを許可するか、文字でお送りください。');return;}
  src=ac.createMediaStreamSource(stream);node=ac.createScriptProcessor(4096,1,1);
  chunks=[];rec=true;heardVoice=false;startAt=lastVoice=performance.now();
  mic.classList.add('on');status('聞いています…（話し終えると自動で送ります）');
  node.onaudioprocess=e=>{
   if(!rec)return;const d=e.inputBuffer.getChannelData(0);chunks.push(new Float32Array(d));
   let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]*d[i];const rms=Math.sqrt(s/(d.length/4));
   const now=performance.now();
   if(rms>0.02){heardVoice=true;lastVoice=now;}
   if(heardVoice&&now-lastVoice>800)finish(true);
   else if(!heardVoice&&now-startAt>9000)finish(false);
   else if(now-startAt>40000)finish(true);
  };
  src.connect(node);node.connect(ac.destination);
 }
 function stopRec(){rec=false;mic.classList.remove('on');try{node&&node.disconnect();src&&src.disconnect();}catch(e){}}
 function finish(send){
  if(!rec)return;stopRec();
  if(!send){status('マイクを押して話しかけてください');return;}
  const wav=toWav(chunks,ac.sampleRate);chunks=[];
  const fd=new FormData();fd.append('audio',wav,'voice.wav');
  askStream(fd);
 }
 // Sclass：文が届くたびに順に声で流す（最初の文からすぐ話し始める）
 async function askStream(fd){
  busy=true;const w=bub('a wait','聞いています…');status('聞いています…');
  const queue=[];let playingChain=Promise.resolve(),reply=null,limit=false,ab=null;
  const enqueue=(b64)=>{playingChain=playingChain.then(()=>play(b64));return playingChain;};
  try{
   const h={};if(M&&M.token)h.Authorization='Bearer '+M.token;
   const r=await fetch(API+'/member/voice2',{method:'POST',body:fd,headers:h});
   if(r.status===401){M=null;saveM();throw Object.assign(new Error('ログインが切れました。LINE で「ログイン」とお送りください。'),{status:401});}
   if(!r.ok||!r.body){const j=await r.json().catch(()=>({}));throw new Error(j.detail||'通信できませんでした');}
   const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
   while(true){
    const {done,value}=await rd.read();if(done)break;
    buf+=dec.decode(value,{stream:true});let i;
    while((i=buf.indexOf('\n'))>=0){
     const ln=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!ln)continue;
     let j;try{j=JSON.parse(ln);}catch(e){continue;}
     if(j.type==='heard'){w.remove();if(j.text)bub('u',j.text);status('考えています…');}
     else if(j.type==='sentence'){if(!ab){ab=bub('a','');}ab.textContent+=(ab.textContent?'\n':'')+j.text;status('お話ししています…');if(j.audio)enqueue(j.audio);}
     else if(j.type==='done'){reply=j.reply;limit=!!j.limit_reached;if(j.notice&&ab){/* 既に文として流れている */}}
    }
   }
   await playingChain;w.remove();
   if(limit)callChk.checked=false;
   status(callChk.checked&&!limit?'続けてどうぞ':'マイクを押して話しかけてください');
   busy=false;
   if(callChk.checked&&!limit&&!box.hidden)listen();
  }catch(e){w.remove();bub('a note',e.message);status('マイクを押して話しかけてください');busy=false;if(e.status===401)show();}
 }
 function toWav(parts,rate){
  let n=0;parts.forEach(p=>n+=p.length);const all=new Float32Array(n);let o=0;parts.forEach(p=>{all.set(p,o);o+=p.length;});
  const R=16000,ratio=rate/R,len=Math.floor(all.length/ratio),pcm=new Int16Array(len);
  for(let i=0;i<len;i++){const v=Math.max(-1,Math.min(1,all[Math.floor(i*ratio)]));pcm[i]=v<0?v*0x8000:v*0x7fff;}
  const buf=new ArrayBuffer(44+pcm.length*2),dv=new DataView(buf),w=(p,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(p+i,s.charCodeAt(i));};
  w(0,'RIFF');dv.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
  dv.setUint32(24,R,true);dv.setUint32(28,R*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,pcm.length*2,true);
  new Int16Array(buf,44).set(pcm);return new Blob([buf],{type:'audio/wav'});
 }
 async function play(b64){
  try{
   const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
   const audio=await ensureAC().decodeAudioData(u8.buffer);
   await new Promise(res=>{playing=ac.createBufferSource();playing.buffer=audio;playing.connect(ac.destination);playing.onended=res;playing.start();});
  }catch(e){}finally{playing=null;}
 }
 function stopAll(){stopRec();if(playing){try{playing.stop();}catch(e){}playing=null;}callChk.checked=callChk.checked;}
 mic.addEventListener('click',()=>{ensureAC();if(rec)finish(true);else if(playing){try{playing.stop();}catch(e){}}else listen();});
 box.querySelector('.mjm-stop').addEventListener('click',()=>{callChk.checked=false;stopAll();status('止めました。マイクを押すと、また話せます');});
})();
