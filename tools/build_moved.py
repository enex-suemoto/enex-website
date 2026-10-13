# Googleサイト時代の古いアドレスに来た人へ「ホームページを新しくしました」と知らせる案内ページを作る。
# company.html のヘッダー・フッターを使い、古いアドレスごとのフォルダに index.html を置く。404.html も同じ案内にする。
import re,os
src=open('company.html').read()
head=src.split('<div class="wrap">',1)[0]+'<div class="wrap">\n'
foot='\n </div>\n</main>'+src.split('\n </div>\n</main>',1)[1]
head=head.replace(' aria-current="page"','')
head=head.replace('<title>会社概要｜株式会社エネックス</title>','<title>ホームページを新しくしました｜株式会社エネックス</title>\n<meta name="robots" content="noindex">')
def fix(html,base):
    return re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#)([^"]+)"',lambda m:f'{m.group(1)}="{base}{m.group(2)}"',html)
def body(to,label):
    return f'''  <div class="rv moved">
   <div class="lbl">MOVED</div>
   <h1>ホームページを新しくしました</h1>
   <p class="lead">株式会社エネックスのホームページは、新しくなりました。お探しの情報は、次のページでご覧いただけます。</p>
   <div class="mv-btns"><a class="btn p" href="{to}">{label}</a><a class="btn s2" href="index.html">トップページへ</a></div>
  </div>'''
OLD=[('home','index.html','トップページを見る'),
     ('services','business.html','事業案内を見る'),
     ('profile','company.html','会社概要を見る'),
     ('お問い合わせ','contact.html','お問い合わせへ'),
     ('エネックスのでんき','business.html','事業案内（エネックスの電気）を見る'),
     ('無料見積りをもっと詳しく','business.html','事業案内（エネックスの電気）を見る'),
     ('よくあるご質問','business.html','事業案内を見る')]
for d,to,label in OLD:
    os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(fix(head+body(to,label)+foot,'../'))
# 404：どの深さのアドレスでも表示されるよう、サイトの一番上からの道筋で書く
open('404.html','w').write(fix(head+body('index.html','トップページへ').replace('<a class="btn s2" href="index.html">トップページへ</a>','<a class="btn s2" href="business.html">事業案内を見る</a>')+foot,'/'))
print('ok',len(OLD)+1)
