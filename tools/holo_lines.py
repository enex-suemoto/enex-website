# 参考画像（紺地に光る線）を、線だけの透明PNGにして、色をサイトの6色（白・青・橙）に寄せる
import zlib,struct,sys
def read_bmp(path):
    b=open(path,'rb').read()
    off=struct.unpack('<I',b[10:14])[0];w,h=struct.unpack('<ii',b[18:26]);bpp=struct.unpack('<H',b[28:30])[0]//8
    flip=h>0;h=abs(h);stride=(w*bpp+3)&~3;px=[None]*(w*h)
    for y in range(h):
        row=off+stride*((h-1-y) if flip else y)
        for x in range(w):
            k=row+x*bpp;px[y*w+x]=(b[k+2],b[k+1],b[k])
    return w,h,px
def write_png(path,w,h,px):
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):raw+=bytes(px[y*w+x])
    ch=lambda t,d:struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(bytes(raw),9))+ch(b'IEND',b''))
src,dst=sys.argv[1],sys.argv[2]
w,h,px=read_bmp(src)
# 背景の紺の明るさ（左上の一帯の平均）を基準に、それより明るい分だけを「線」とみなす
bg=[sum(px[y*w+x][c] for y in range(8) for x in range(8))//64 for c in range(3)]
out=[]
WHITE=(255,255,255);BLUE=(55,62,185);ORANGE=(255,148,26)
for p in px:
    lum=max(p[0]-bg[0],p[1]-bg[1],p[2]-bg[2])
    a=0 if lum<22 else min(255,int((lum-22)*255/150))
    if a==0:out.append((0,0,0,0));continue
    r,g,b=p
    # 黄色っぽい線は橙、青っぽい線は青、それ以外（白っぽい・シアン）は白
    if r>b+30 and g>b+30:col=ORANGE
    elif b>r+40 and b>g-10:col=BLUE
    else:col=WHITE
    # 細い線の内側ほど白に寄せて芯を作る
    k=min(1,(lum-22)/150);col=tuple(int(c+(255-c)*k*0.5) for c in col)
    out.append((col[0],col[1],col[2],a))
write_png(dst,w,h,out)
print('ok',w,h,bg,sum(1 for p in out if p[3])/len(out))
