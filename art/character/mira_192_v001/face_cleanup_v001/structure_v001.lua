-- Focused anatomy cleanup of the ACTUAL latest editable sprite.
-- Run from repository root. stage=structure exposes guides before features move.
-- Default stage=final; choose an unused revision (default 003).
local THIS=debug.getinfo(1,'S').source:sub(2)
local function main()
local ROOT='art/character/mira_192_v001/'
local OUT=ROOT..'face_cleanup_v001/'
local INPUT=ROOT..'portrait_v002.aseprite'
local STAGE=app.params.stage or 'final'
local REV=app.params.revision or '003'
local STEM=STAGE=='structure' and ('structure_v'..REV) or ('portrait_v'..REV)
assert(not app.fs.isFile(OUT..STEM..'.aseprite'),'Output exists; select an unused revision')
local s=assert(app.open(INPUT),'Cannot open latest editable source')
local W,H=s.width,s.height
assert(W==192 and H==256 and s.colorMode==ColorMode.INDEXED and #s.frames==1)
local before=Image(W,H,ColorMode.RGB); before:clear(0); before:drawSprite(s,1)
local C={clear=0,ink=1,hair0=2,hair1=3,hair2=4,hair3=5,hair4=6,hair5=7,
 skin0=8,skin1=9,skin2=10,skin3=11,skin4=12,skin5=13,blush=14,lip=15,lip0=16,
 top0=17,top1=18,top2=19,top3=20,plum0=21,plum1=22,plum2=23,plum3=24,
 plum4=25,teal0=26,teal1=27,teal2=28,teal3=29,silver0=30,silver1=31,silver2=32}
local layers={}; local originals={}; local changed={}; local im
for _,l in ipairs(s.layers) do
 layers[l.name]=l
 local cel=assert(l:cel(1)); local a=Image(W,H,ColorMode.INDEXED); a:clear(0)
 a:drawImage(cel.image,cel.position); originals[l.name]=a
end
local function edit(name)
 im=Image(originals[name]); changed[name]=im
end
local function px(x,y,c)
 assert(x==math.floor(x) and y==math.floor(y),'Only native integer coordinates')
 if x>=0 and x<W and y>=0 and y<H then im:drawPixel(x,y,C[c] or c) end
end
local function line(x0,y0,x1,y1,c)
 local dx,dy=math.abs(x1-x0),-math.abs(y1-y0)
 local sx,sy=x0<x1 and 1 or -1,y0<y1 and 1 or -1; local e=dx+dy
 while true do
  px(x0,y0,c); if x0==x1 and y0==y1 then break end
  local t=e*2
  if t>=dy then e=e+dy; x0=x0+sx end
  if t<=dx then e=e+dx; y0=y0+sy end
 end
end
local function path(p,c,closed)
 for i=1,#p-1 do line(p[i][1],p[i][2],p[i+1][1],p[i+1][2],c) end
 if closed then line(p[#p][1],p[#p][2],p[1][1],p[1][2],c) end
end
local function poly(p,c,edge)
 local lo,hi=H,0
 for _,v in ipairs(p) do lo=math.min(lo,v[2]); hi=math.max(hi,v[2]) end
 for y=lo,hi do
  local hits={}
  for i,a in ipairs(p) do local b=p[i%#p+1]
   if (a[2]<=y and b[2]>y) or (b[2]<=y and a[2]>y) then
    hits[#hits+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2])
   end
  end
  table.sort(hits)
  for i=1,#hits-1,2 do for x=math.ceil(hits[i]),math.floor(hits[i+1]) do px(x,y,c) end end
 end
 path(p,edge or c,true)
end
local function rect(x,y,w,h,c)
 for yy=y,y+h-1 do for xx=x,x+w-1 do px(xx,yy,c) end end
end
-- Retain the source eye-line slope and facial coordinate basis. The lower
-- anchors move locally; no sprite, layer, image or reference is transformed.
local F={origin={94,77},tilt=0.19,shear=-0.12,
 forehead={23,-30},nearEye={0,0},farEye={30,0},bridge={20,0},
 nose={23,13},mouth={18,24},chin={20,39}}
local function facepoint(u,v)
 return {F.origin[1]+math.floor(u+v*F.shear+0.5),F.origin[2]+math.floor(v+u*F.tilt+0.5)}
end
local function fp(p) local q={}; for _,v in ipairs(p) do q[#q+1]=facepoint(v[1],v[2]) end; return q end
local function feature(a,p)
 local q={}; for _,v in ipairs(p) do q[#q+1]=facepoint(a[1]+v[1],a[2]+v[2]) end; return q
end
local function ep(a,p,c,e) poly(feature(a,p),c,e) end
local function el(a,p,c,closed) path(feature(a,p),c,closed) end
local function fpath(p,c,closed) path(fp(p),c,closed) end
local chin=facepoint(F.chin[1],F.chin[2])
local jaw={
 {140,91},{137,97},{133,103},{128,109},{122,115},{116,119},
 {chin[1]+3,chin[2]},{chin[1]-2,chin[2]},
 {102,118},{96,114},{90,109},{85,103},{81,96},{77,88}}

-- 1. Rebuild just the face plane. Upper outline, ear and all other layers
-- are retained. Cheekbones retain width; taper starts below them.
edit('05 Face and ear')
rect(76,42,66,83,'clear')
local outline={{76,72},{85,58},{104,43},{116,42},{127,47},{134,56},
 {139,68},{141,80}}
for _,p in ipairs(jaw) do outline[#outline+1]=p end
outline[#outline+1]={73,87}
poly(outline,'skin4','skin1')
-- Near cheek plane joins the jaw edge continuously, with a narrow warm
-- transition instead of a large isolated cheek or muzzle highlight.
poly({{77,87},{81,96},{85,103},{90,109},{96,114},{102,118},
 {107,120},{112,120},{107,118},{101,114},{95,110},{90,105},
 {86,99},{83,91},{82,87}},'skin3')
poly({{80,95},{85,103},{90,109},{96,114},{102,118},{107,120},
 {109,120},{103,117},{97,113},{92,108},{88,102},{84,95}},'skin2')
-- Restrained far-temple shadow remains connected to the existing outer edge.
poly({{115,44},{125,48},{132,57},{137,69},{139,81},{139,88},
 {136,89},{135,74},{130,59},{123,50}},'skin3')
-- One narrow forehead/nasal light plane; no floating lower-cheek patches.
poly({{111,63},{113,67},{114,73},{113,80},{111,87},{113,91},
 {112,92},{109,88},{110,82},{111,74},{109,68}},'skin5')
-- Subtle under-eye warmth, aligned to the shared tilt.
ep(F.nearEye,{{-9,10},{-4,10},{0,11},{-4,11},{-8,10}},'skin3')
ep(F.farEye,{{-1,10},{3,9},{5,10},{2,11}},'skin3')
-- A small, single chin light plane has no U/ring-shaped boundary.
ep(F.chin,{{-3,-5},{2,-5},{4,-6},{2,-4},{-1,-4}},'skin5')

-- 2. Refit ONLY the exposed jaw/neck connection. The high collar and every
-- pixel below y122 remain source pixels. Do not repaint clothing.
edit('04 Neck')
for y=99,122 do for x=76,116 do
 local v=originals['04 Neck']:getPixel(x,y)
 if v>=C.skin0 and v<=C.skin5 then px(x,y,'skin2') end
end end
poly({{78,100},{84,104},{89,109},{96,115},{104,120},{109,121},
 {106,122},{94,122},{85,115},{80,108}},'skin0')
poly({{78,108},{84,117},{91,122},{86,122},{80,117}},'skin1')
-- Restore pixels beyond the original neck mask; this is an edge repaint,
-- never an expansion of the neck silhouette or a replacement of the collar.
for y=0,H-1 do for x=0,W-1 do
 local old=originals['04 Neck']:getPixel(x,y)
 if y<99 or y>122 or old<C.skin0 or old>C.skin5 then px(x,y,old) end
end end

-- The structure export deliberately keeps original features intact. Inspect
-- its guide overlay before executing the final feature edits below.
if STAGE~='structure' then
 edit('06 Eyes and brows')
 -- Redraw eyes/brows from common anchors, preserving near-eye size and brow
 -- expression. The far iris narrows one pixel without shrinking the eye.
 im:clear(0)
 local E=F.nearEye
 ep(E,{{-12,-1},{-8,-2},{-2,-2},{6,-1},{11,1},{7,3},{1,4},{-6,2}},'silver2')
 ep(E,{{-4,-2},{2,-2},{4,0},{4,3},{1,4},{-3,3},{-4,1}},'teal0')
 ep(E,{{-3,0},{3,0},{3,3},{0,4},{-3,2}},'teal1')
 el(E,{{-2,3},{1,3},{2,2}},'teal2')
 el(E,{{1,-2},{1,1},{0,2}},'hair0')
 el(E,{{-3,-1},{-2,-1}},'teal3')
 el(E,{{-12,-2},{-9,-3},{-3,-3},{3,-3},{8,-1},{11,1}},'ink')
 el(E,{{-12,-3},{-8,-4},{-3,-4},{3,-3},{8,-2}},'ink')
 el(E,{{-13,-4},{-11,-2}},'ink')
 el(E,{{-8,3},{-3,4},{3,5},{7,3}},'skin1')
 el(E,{{-11,-7},{-6,-8},{0,-8},{7,-6}},'skin1')
 el(E,{{-9,-11},{-4,-13},{2,-13},{9,-11},{12,-9}},'hair1')
 el(E,{{-4,-12},{2,-12},{9,-10}},'hair2')
 E=F.farEye
 ep(E,{{-8,0},{-5,-1},{0,-2},{5,-1},{8,1},{5,3},{0,4},{-5,2}},'silver2')
 ep(E,{{-2,-2},{2,-1},{3,1},{2,4},{0,4},{-3,2}},'teal0')
 ep(E,{{-2,0},{2,0},{2,3},{0,4},{-2,2}},'teal1')
 el(E,{{-1,3},{1,3}},'teal2')
 el(E,{{1,-1},{1,2}},'hair0')
 el(E,{{-1,0},{0,0}},'teal3')
 el(E,{{-8,-1},{-5,-2},{0,-3},{5,-2},{8,1},{9,0}},'ink')
 el(E,{{-5,-1},{-2,-2},{3,-2}},'ink')
 el(E,{{-4,3},{0,5},{4,4}},'skin1')
 el(E,{{-6,-6},{-2,-7},{3,-7},{6,-5}},'skin1')
 el(E,{{-8,-10},{-3,-12},{2,-12},{6,-10}},'hair1')
 el(E,{{-3,-11},{2,-11},{6,-9}},'hair2')

 edit('07 Nose and mouth'); im:clear(0)
 ep(F.nose,{{0,-2},{1,0},{0,1},{-2,1}},'skin2')
 el(F.nose,{{-1,1},{0,1}},'skin1')
 el(F.nose,{{1,-2},{1,-1}},'skin5')
 ep(F.mouth,{{-6,0},{-1,1},{5,0},{3,2},{0,2},{-3,1}},'lip')
 el(F.mouth,{{-8,-2},{-6,-1},{-2,0},{2,0},{6,-1},{8,-2}},'lip0')
 el(F.mouth,{{-6,-1},{-2,0},{1,0}},'skin0')
 el(F.mouth,{{0,2},{3,2}},'blush')

 edit('08 Glasses'); im:clear(0)
 -- Keep bridge, width, upper-rim placement and temples. Lift the bottom rims
 -- one native pixel so their shape no longer exaggerates cheek breadth.
 fpath({{-15,-6},{-8,-7},{4,-7},{15,-5},{17,-2},{16,5},{13,7},
  {8,9},{-7,10},{-12,7},{-14,1}},'ink',true)
 fpath({{24,-4},{31,-5},{40,-4},{42,-2},{40,5},{36,8},{27,8},{24,5},{23,0}},'ink',true)
 el(F.bridge,{{-3,0},{0,-1},{3,0}},'ink')
 fpath({{-15,-4},{-20,-5},{-26,-3},{-28,-1}},'ink')
 fpath({{42,-2},{44,-3},{45,-1}},'ink')
 fpath({{-13,-6},{-9,-7},{-5,-7}},'silver0')
 fpath({{34,-5},{38,-4}},'silver0')
 el(F.bridge,{{-3,1},{-3,2}},'silver0')
end

edit('11 Construction guides - hidden'); im:clear(0)
local centerline={F.forehead,{21,-14},F.bridge,F.nose,F.mouth,F.chin}
fpath(centerline,'teal2')
fpath({{-17,0},{42,0}},'teal3')
for _,a in ipairs({F.forehead,F.bridge,F.nose,F.mouth,F.chin}) do
 el(a,{{-2,0},{2,0}},'teal3'); el(a,{{0,-2},{0,2}},'teal3')
end
el(F.mouth,{{-8,0},{8,0}},'teal2')
el(F.chin,{{-4,0},{4,0}},'teal2')
-- Temporary guide also marks the proposed jaw contour in one-pixel clusters.
path(jaw,'teal1')
for name,a in pairs(changed) do
 local cel=layers[name]:cel(1); cel.image=a; cel.position=Point(0,0)
end
layers['11 Construction guides - hidden'].isVisible=STAGE=='structure'
s.data=s.data..' | Focused face cleanup from portrait_v002; shared facial anchors; protected layers retained.'
s:saveAs(OUT..STEM..'.aseprite')
local native=Image(W,H,ColorMode.RGB); native:clear(0); native:drawSprite(s,1)
local function scale(src,n,bg)
 local dst=Image(src.width*n,src.height*n,ColorMode.RGB)
 for y=0,dst.height-1 do for x=0,dst.width-1 do
  local v=src:getPixel(math.floor(x/n),math.floor(y/n))
  if bg and app.pixelColor.rgbaA(v)==0 then v=bg end
  dst:drawPixel(x,y,v)
 end end; return dst
end
local function crop(src)
 local dst=Image(84,88,ColorMode.RGB)
 for y=0,87 do for x=0,83 do dst:drawPixel(x,y,src:getPixel(x+60,y+42)) end end
 return dst
end
native:saveAs(OUT..STEM..'.png')
scale(native,4):saveAs(OUT..STEM..'_4x.png')
local face=crop(native); face:saveAs(OUT..STEM..'_face.png')
scale(face,8):saveAs(OUT..STEM..'_face_8x.png')
local oldface=crop(before)
local comparison=Image(176,88,ColorMode.RGB)
comparison:clear(app.pixelColor.rgba(34,36,46,255))
comparison:drawImage(oldface,Point(0,0)); comparison:drawImage(face,Point(92,0))
comparison:saveAs(OUT..STEM..'_before_after_native.png')
scale(comparison,6):saveAs(OUT..STEM..'_before_after_6x.png')
scale(native,4,app.pixelColor.rgba(236,232,221,255)):saveAs(OUT..STEM..'_light.png')
scale(native,4,app.pixelColor.rgba(20,23,33,255)):saveAs(OUT..STEM..'_dark.png')
-- Export a hidden-guides view separately; final sprite is always saved hidden.
if STAGE~='structure' then
 layers['11 Construction guides - hidden'].isVisible=true
 local guide=Image(W,H,ColorMode.RGB); guide:clear(0); guide:drawSprite(s,1)
 scale(crop(guide),8):saveAs(OUT..STEM..'_guides_8x.png')
 layers['11 Construction guides - hidden'].isVisible=false
end
local f=assert(io.open(THIS,'rb')); local code=f:read('*a'); f:close()
f=assert(io.open(OUT..STEM..'.lua','wb')); f:write(code); f:close()
s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/mira_192_v001/face_cleanup_v001/error.txt','w'))
 f:write(tostring(err)); f:close(); error(err)
end
