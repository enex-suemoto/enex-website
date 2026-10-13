# 切り出したコマ（BMP 200×140）を線だけの透明にして、1枚のコマ表（5列）に並べる
# 使い方: python3 sheet.py 出力.png コマ1.bmp コマ2.bmp ...
import zlib,struct,sys
W,H,COLS=200,140,5
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
WHITE=(255,255,255);BLUE=(55,62,185);ORANGE=(255,148,26)
def lines(px):
    bg=[sum(px[y*W+x][c] for y in range(6) for x in range(6))//36 for c in range(3)]
    out=[]
    for p in px:
        lum=max(p[0]-bg[0],p[1]-bg[1],p[2]-bg[2])
        a=0 if lum<26 else min(255,int((lum-26)*255/140))
        if a==0:out.append((0,0,0,0));continue
        r,g,b=p
        if r>b+30 and g>b+30:col=ORANGE
        elif b>r+40 and b>g-10:col=BLUE
        else:col=WHITE
        k=min(1,(lum-26)/140);col=tuple(int(c+(255-c)*k*0.5) for c in col)
        out.append((col[0],col[1],col[2],a))
    return out
dst=sys.argv[1];files=sys.argv[2:]
rows=(len(files)+COLS-1)//COLS
sheet=[(0,0,0,0)]*(W*COLS*H*rows)
for i,f in enumerate(files):
    w,h,px=read_bmp(f);assert (w,h)==(W,H),(f,w,h)
    cell=lines(px);ox=(i%COLS)*W;oy=(i//COLS)*H
    for y in range(H):
        sheet[(oy+y)*W*COLS+ox:(oy+y)*W*COLS+ox+W]=cell[y*W:(y+1)*W]
write_png(dst,W*COLS,H*rows,sheet)
print(dst,len(files),'frames',W*COLS,'x',H*rows)
