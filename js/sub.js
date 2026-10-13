// 下層ページ用（見出しの描画は持たない）
// 各区画を画面に入った時に浮かび上がらせる（上の端が画面の下から15%に来たら。縦に長い区画でも必ず合図が出る）
// 説明の絵（SVGの動き）は、動きを減らす設定がオンなら半分の速さにする
if(matchMedia('(prefers-reduced-motion:reduce)').matches)document.querySelectorAll('animate,animateMotion,set').forEach(a=>{
 const d=a.getAttribute('dur');if(d&&d.endsWith('s'))a.setAttribute('dur',(parseFloat(d)*2)+'s');
 const b=a.getAttribute('begin');if(b)a.setAttribute('begin',b.replace(/\+([\d.]+)s/,(m,x)=>'+'+(parseFloat(x)*2)+'s'));});
const started=new Set();
function startAnim(id){const a=document.getElementById(id);if(a&&!started.has(id)&&a.beginElement){started.add(id);a.beginElement();}}
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');
  e.target.querySelectorAll&&e.target.querySelectorAll('animateMotion').forEach(m=>startAnim(m.id));io.unobserve(e.target);}});},{threshold:0,rootMargin:'0px 0px -15% 0px'});
document.querySelectorAll('.rv').forEach(x=>io.observe(x));

// お問い合わせ：入力内容をメールソフトに渡す（サーバーを持たないため）
const form=document.getElementById('cform');
if(form){
 form.addEventListener('submit',ev=>{ev.preventDefault();
  let ok=true;
  form.querySelectorAll('[required]').forEach(x=>{
   const f=x.closest('.f');const bad=x.type==='checkbox'?!x.checked:!x.value.trim()||(x.type==='email'&&!x.checkValidity());
   if(f)f.classList.toggle('bad',bad);if(bad)ok=false;});
  if(!ok){const b=form.querySelector('.bad input,.bad textarea');b&&b.focus();return;}
  const v=n=>(form.elements[n].value||'').trim();
  const body=['会社名：'+v('company'),'お名前：'+v('name'),'電話番号：'+v('tel'),'メール：'+v('email'),'','お問い合わせ内容：',v('message')].join('\n');
  location.href='mailto:info@enex.one?subject='+encodeURIComponent('ホームページからのお問い合わせ（'+v('company')+'）')+'&body='+encodeURIComponent(body);
 });
}
