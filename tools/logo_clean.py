# 白い背景を透明にする（中央の帯＝文字の部分は残す）。PNG の読み書きは標準ライブラリだけで行う
import zlib,struct,sys

def read_png(path):
    b=open(path,'rb').read()
    off=struct.unpack('<I',b[10:14])[0];w,h=struct.unpack('<ii',b[18:26]);bpp=struct.unpack('<H',b[28:30])[0]//8
    flip=h>0;h=abs(h);stride=(w*bpp+3)&~3;px=[None]*(w*h)
    for y in range(h):
        row=off+stride*((h-1-y) if flip else y)
        for x in range(w):
            k=row+x*bpp;bl,g,r=b[k],b[k+1],b[k+2];a=b[k+3] if bpp==4 else 255
            px[y*w+x]=[r,g,bl,a]
    return w,h,px
def write_png(path,w,h,px):
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):raw+=bytes(px[y*w+x])
    def ch(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(bytes(raw),9))+ch(b'IEND',b''))
src,dst=sys.argv[1],sys.argv[2]
w,h,px=read_png(src)
P=lambda x,y:px[y*w+x]
# 帯の範囲：濃いオレンジの画素が横幅の6割以上並ぶ行
def orange(p):r,g,b,a=p;return r>200 and 80<g<170 and b<90
rows=[y for y in range(h) if sum(orange(P(x,y)) for x in range(w))>w*0.6]
y0,y1=min(rows),max(rows)
cols=[x for x in range(w) if sum(orange(P(x,y)) for y in range(y0,y1+1))>(y1-y0)*0.6]
x0,x1=min(cols),max(cols)
print('band',x0,y0,x1,y1)
m=4  # 外側の灰色の枠を消すため、端の数画素は透明にする
inband=lambda x,y:x0<=x<=x1 and y0<=y<=y1
T=[[False]*w for _ in range(h)]
for y in range(h):
    for x in range(w):
        if x<m or y<m or x>=w-m or y>=h-m: T[y][x]=True;continue
        if inband(x,y):continue
        r,g,b,_=P(x,y)
        if min(r,g,b)>232: T[y][x]=True
orig=[p[:] for p in px]
def near(x,y,d):
    for dy in range(-d,d+1):
        for dx in range(-d,d+1):
            xx,yy=x+dx,y+dy
            if 0<=xx<w and 0<=yy<h and T[yy][xx]:return True
    return False
for y in range(h):
    for x in range(w):
        p=P(x,y)
        if T[y][x]:p[:]=[0,0,0,0];continue
        if inband(x,y) or not near(x,y,1):continue
        # 輪郭の画素：白と混ざった色を、内側の色と透明さに分け直す
        best=None
        for d in (2,3,4):
            for dy,dx in ((-d,0),(d,0),(0,-d),(0,d),(-d,-d),(d,d),(-d,d),(d,-d)):
                xx,yy=x+dx,y+dy
                if 0<=xx<w and 0<=yy<h and not T[yy][xx] and not near(xx,yy,1):
                    best=orig[yy*w+xx];break
            if best:break
        if not best:continue
        r,g,b,_=orig[y*w+x]
        k=max(range(3),key=lambda c:255-best[c])
        den=255-best[k]
        a=1.0 if den<=0 else max(0.0,min(1.0,(255-(r,g,b)[k])/den))
        p[:]=[best[0],best[1],best[2],round(a*255)]
# 余白を切り詰める
ys=[y for y in range(h) if any(P(x,y)[3] for x in range(w))];xs=[x for x in range(w) if any(P(x,y)[3] for y in range(h))]
X0,X1,Y0,Y1=min(xs),max(xs),min(ys),max(ys)
W,H=X1-X0+1,Y1-Y0+1
write_png(dst,W,H,[P(x,y) for y in range(Y0,Y1+1) for x in range(X0,X1+1)])
print('saved',W,H)
