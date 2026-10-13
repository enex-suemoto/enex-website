# パンフレットの元（pamphlet/pamphlet.html）を作る。立方体の階段の絵はここで計算して描く
s=15  # 立方体の一辺（mm相当）
def cube(cx,cy):
    h=s*0.5; w=s*0.866
    top=f'{cx},{cy} {cx+w},{cy+h} {cx},{cy+2*h} {cx-w},{cy+h}'
    left=f'{cx-w},{cy+h} {cx},{cy+2*h} {cx},{cy+2*h+s} {cx-w},{cy+h+s}'
    right=f'{cx+w},{cy+h} {cx},{cy+2*h} {cx},{cy+2*h+s} {cx+w},{cy+h+s}'
    return (f'<polygon points="{top}" fill="#ff941a" fill-opacity=".55"/>'
            f'<polygon points="{left}" fill="#fb7132"/>'
            f'<polygon points="{right}" fill="#fb7132" fill-opacity=".8"/>')
w=s*0.866
parts=[]
cols=6
for i in range(cols):           # 左下から右上へ、列ごとに1段ずつ高くする
    hgt=i+1
    bx=18+i*w; by=118-i*s*0.5
    for k in range(hgt):
        parts.append(cube(bx,by-k*s))
for (x,y,sc) in [(130,22,.5),(142,40,.7),(152,58,.45)]:
    parts.append(f'<g transform="translate({x},{y}) scale({sc}) translate({-x},{-y})">'+cube(x,y)+'</g>')
stairs='<svg class="stairs" viewBox="0 0 160 150">'+''.join(parts)+'</svg>'
html=open('pamphlet/template.html').read().replace('<!--STAIRS-->',stairs)
open('pamphlet/pamphlet.html','w').write(html)
print('ok',len(html))
