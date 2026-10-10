-- Mira: direct native pixel construction. Run from the repository root.
-- Aseprite --batch --script-param stage=1 --script this-file.lua
-- Stages 1..5: silhouette, construction, face, material, accessories.
-- No reference pixels are loaded. No image generation, tracing or resampling.
local function main()
local W,H=192,256
local ROOT='art/character/mira_192_v001/'
local STAGE=tonumber(app.params.stage or '5')
local REV=app.params.revision or '001'
local STEM=STAGE<5 and ('stage0'..STAGE) or ('portrait_v'..REV)
assert(not app.fs.isFile(ROOT..STEM..'.aseprite'),'Version exists; choose a new revision')
local s=Sprite(W,H,ColorMode.INDEXED)
local colors={
 {'ink','141522'},
 {'hair0','111d3e'},{'hair1','1a2b59'},{'hair2','273f7b'},
 {'hair3','38569c'},{'hair4','4b6bb3'},{'hair5','6c83c1'},
 {'skin0','8c5d65'},{'skin1','b67f7c'},{'skin2','d79d89'},
 {'skin3','efb797'},{'skin4','f8c8a5'},{'skin5','ffdab8'},
 {'blush','e8a396'},{'lip','c98386'},{'lip0','955961'},
 {'top0','191a24'},{'top1','242631'},{'top2','30333f'},{'top3','444753'},
 {'plum0','271e30'},{'plum1','3a283f'},{'plum2','50354f'},
 {'plum3','68465f'},{'plum4','805a71'},
 {'teal0','194f68'},{'teal1','278498'},{'teal2','4ec1ce'},{'teal3','99e7e4'},
 {'silver0','697e90'},{'silver1','a7b8bf'},{'silver2','e9e6dc'},
}
local C={clear=0}; local pal=Palette(#colors+1)
pal:setColor(0,Color{r=0,g=0,b=0,a=0})
for i,v in ipairs(colors) do
 C[v[1]]=i; local h=v[2]
 pal:setColor(i,Color{r=tonumber(h:sub(1,2),16),g=tonumber(h:sub(3,4),16),b=tonumber(h:sub(5,6),16),a=255})
end
s:setPalette(pal); s.transparentColor=0
s.data='Mira / rebuilt 192x256 / one base portrait / 32 opaque colors / native integer construction'
local buffers={}; local im
local function layer(name,visible)
 local l=#buffers==0 and s.layers[1] or s:newLayer()
 l.name=name; l.isVisible=visible~=false
 im=Image(W,H,ColorMode.INDEXED); im:clear(0)
 buffers[#buffers+1]={l=l,im=im}
 return l
end
local function px(x,y,c)
 assert(x==math.floor(x) and y==math.floor(y),'Noninteger native coordinate')
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
-- All features share one tilted coordinate frame. x is the eye-line axis;
-- y follows the face. Local anchors are relative to the near iris center.
local F={origin={94,77},tilt=0.19,shear=-0.12,
 nearEye={0,0},farEye={30,0},bridge={20,0},nose={23,13},mouth={16,24},chin={18,39}}
local function facepoint(u,v)
 return {F.origin[1]+math.floor(u+v*F.shear+0.5),F.origin[2]+math.floor(v+u*F.tilt+0.5)}
end
local function fp(p) local q={}; for _,v in ipairs(p) do q[#q+1]=facepoint(v[1],v[2]) end; return q end
local function fpath(p,c,closed) path(fp(p),c,closed) end
local function fpoly(p,c,edge) poly(fp(p),c,edge) end
local function feature(anchor,p)
 local q={}; for _,v in ipairs(p) do q[#q+1]={anchor[1]+v[1],anchor[2]+v[2]} end; return fp(q)
end
local function ep(anchor,p,c,edge) poly(feature(anchor,p),c,edge) end
local function el(anchor,p,c,closed) path(feature(anchor,p),c,closed) end

layer('01 Back hair')
poly({{37,87},{36,69},{40,48},{49,34},{61,25},{82,17},{99,14},{114,16},
 {128,23},{140,28},{148,38},{152,53},{155,67},{153,84},{152,95},{157,105},
 {155,115},{160,127},{168,138},{159,157},{169,176},{172,203},{176,228},
 {171,249},{152,255},{24,255},{13,247},{9,238},{11,223},{18,205},{19,186},
 {24,165},{31,146},{33,127},{38,111},{35,100}},'hair1','hair0')

layer('02 Clothing - black knit')
poly({{75,119},{102,118},{111,126},{120,135},{135,159},{145,192},{147,220},
 {141,242},{147,255},{39,255},{40,231},{44,204},{45,180},{52,153},{61,134}},'top1','ink')

layer('03 Clothing - plum blazer')
poly({{68,133},{76,131},{75,144},{63,163},{55,184},{51,211},{55,234},
 {63,255},{14,255},{15,244},{12,226},{14,208},{13,185},{14,165},{17,156},
 {25,152},{38,150},{53,144}},'plum2','plum0')
poly({{112,124},{122,132},{139,139},{154,137},{166,138},{174,144},
 {179,157},{178,179},{181,200},{178,215},{183,232},{185,255},
 {137,255},{140,239},{140,221},{135,198},{127,171},{119,147}},'plum2','plum0')

layer('04 Neck')
poly({{76,98},{106,108},{114,116},{108,126},{99,133},{87,132},{76,126}},'skin3')
if STAGE>=3 then
 poly({{77,101},{85,108},{95,117},{108,119},{106,126},{100,129},{87,123},{80,115}},'skin0')
 poly({{77,109},{84,119},{96,128},{101,131},{86,130},{78,125}},'skin2')
end
-- High collar occludes the neck base and follows the shoulder tilt.
poly({{74,123},{83,126},{94,127},{104,124},{109,121},{114,132},{113,142},
 {104,148},{94,150},{82,146},{76,139}},'top0','ink')

layer('05 Face and ear')
poly({{76,72},{85,58},{104,43},{116,42},{127,47},{134,56},{139,68},
 {141,80},{140,91},{136,101},{129,109},{119,117},{109,122},{104,122},
 {97,118},{88,111},{82,104},{77,94},{73,87}},'skin4','skin1')
poly({{70,78},{66,75},{62,76},{59,81},{60,86},{64,92},{68,95},{73,91},{76,84}},'skin3','skin1')
if STAGE>=3 then
 -- Warm side plane, compact under-jaw plane, and broad quiet cheek light.
 poly({{77,87},{80,99},{85,107},{94,114},{104,120},{109,122},{104,122},
  {97,118},{88,111},{82,104},{77,94}},'skin2')
 poly({{80,99},{84,104},{87,107},{87,110},{82,105},{78,97}},'skin1')
 poly({{115,44},{125,48},{132,57},{137,69},{139,81},{139,88},
  {136,89},{135,74},{130,59},{123,50}},'skin3')
 poly({{98,71},{105,65},{111,63},{115,73},{112,82},{109,88},{114,94},
  {111,97},{99,96},{87,91},{84,85},{89,80}},'skin5')
 poly({{117,95},{125,94},{132,92},{129,99},{121,104},{117,101}},'skin5')
 poly({{94,110},{100,113},{107,115},{116,113},{110,118},{104,119},{99,116}},'skin5')
 -- Small ear helix and concha; the face lock covers its forward attachment.
 path({{63,80},{66,78},{69,80},{69,84},{66,88}},'skin1')
 path({{63,82},{65,81},{66,83},{65,85}},'skin2')
 line(61,82,62,85,'skin5'); line(65,90,68,92,'skin4')
 fpoly({{-10,10},{-3,10},{1,11},{-3,12},{-9,11}},'blush')
 fpoly({{30,10},{34,9},{36,10},{33,11}},'skin3')
end

-- Face, features and materials are filled after the silhouette review.
layer('06 Eyes and brows')
if STAGE>=3 then
 local E=F.nearEye
 ep(E,{{-12,-1},{-8,-3},{-2,-3},{6,-2},{11,0},{7,4},{1,5},{-6,3}},'silver2')
 ep(E,{{-4,-3},{2,-3},{5,-1},{5,3},{2,5},{-3,4},{-5,1}},'teal0')
 ep(E,{{-3,0},{3,0},{3,4},{0,5},{-3,3}},'teal1')
 ep(E,{{-2,2},{3,2},{2,4},{-1,4}},'teal2')
 ep(E,{{0,-3},{2,-3},{2,2},{0,3},{-1,1}},'hair0')
 el(E,{{-3,-1},{-2,-1}},'teal3'); el(E,{{-3,-2},{-2,-2}},'silver2')
 el(E,{{-12,-2},{-9,-3},{-3,-4},{3,-4},{8,-2},{11,0}},'ink')
 el(E,{{-12,-3},{-8,-4},{-3,-5},{3,-4},{8,-3}},'ink')
 el(E,{{-13,-4},{-11,-2}},'ink')
 el(E,{{-8,4},{-3,5},{3,6},{7,4}},'skin1')
 el(E,{{-11,-7},{-6,-8},{0,-8},{7,-6}},'skin1')
 el(E,{{-9,-11},{-4,-13},{2,-13},{9,-11},{12,-9}},'hair1')
 el(E,{{-4,-12},{2,-12},{9,-10}},'hair2')
 E=F.farEye
 ep(E,{{-8,0},{-5,-2},{0,-3},{5,-2},{8,0},{5,3},{0,4},{-5,3}},'silver2')
 ep(E,{{-2,-3},{3,-2},{4,0},{3,3},{0,4},{-3,2}},'teal0')
 ep(E,{{-2,0},{3,0},{3,3},{0,4},{-2,2}},'teal1')
 el(E,{{-1,3},{2,3}},'teal2')
 ep(E,{{1,-2},{2,-2},{2,1},{1,2},{0,1}},'hair0')
 el(E,{{-1,-1},{0,-1}},'silver2')
 el(E,{{-8,0},{-5,-3},{0,-4},{5,-3},{8,-1},{9,-2}},'ink')
 el(E,{{-6,-2},{-2,-3},{3,-3},{7,-1}},'ink')
 el(E,{{-4,4},{1,5},{5,3}},'skin1')
 el(E,{{-6,-6},{-2,-7},{3,-7},{6,-5}},'skin1')
 el(E,{{-8,-10},{-3,-12},{2,-12},{6,-10}},'hair1')
 el(E,{{-3,-11},{2,-11},{6,-9}},'hair2')
end
layer('07 Nose and mouth')
if STAGE>=3 then
 -- Nose stays immediately below the bridge on the shared curved centerline.
 ep(F.nose,{{0,-4},{2,-1},{2,1},{-1,2},{-3,1}},'skin2')
 el(F.nose,{{-2,1},{0,2},{2,1}},'skin1')
 el(F.nose,{{1,-3},{2,-1}},'skin5')
 -- Closed smile with one lifted corner; no isolated tooth-white pixels.
 ep(F.mouth,{{-8,-1},{-3,0},{2,1},{8,-1},{6,3},{2,4},{-2,3}},'lip')
 el(F.mouth,{{-9,-2},{-7,-1},{-3,0},{2,0},{6,-1},{9,-3}},'lip0')
 el(F.mouth,{{-8,-1},{-4,0},{1,1},{5,0}},'skin0')
 el(F.mouth,{{-1,3},{3,3}},'blush')
 el(F.mouth,{{9,-3},{9,-4}},'skin1')
 el(F.mouth,{{-1,7},{3,7}},'skin5')
end
layer('08 Glasses')
if STAGE>=3 then
 fpath({{-15,-6},{-8,-7},{4,-7},{15,-5},{17,-2},{16,5},{13,9},
  {8,11},{-7,11},{-12,8},{-14,1}},'ink',true)
 fpath({{24,-4},{31,-5},{40,-4},{42,-2},{40,6},{36,9},{27,9},{24,6},{23,0}},'ink',true)
 el(F.bridge,{{-3,0},{0,-1},{3,0}},'ink')
 fpath({{-15,-4},{-20,-5},{-26,-3},{-28,-1}},'ink')
 fpath({{42,-2},{44,-3},{45,-1}},'ink')
 fpath({{-13,-6},{-9,-7},{-5,-7}},'silver0')
 fpath({{34,-5},{38,-4}},'silver0')
 el(F.bridge,{{-3,1},{-3,2}},'silver0')
end

layer('09 Front hair')
-- Swept fringe preserves a broad near cheek and a narrower far temple.
poly({{38,77},{40,55},{46,40},{57,29},{72,21},{91,15},{106,14},{119,18},
 {129,24},{132,30},{124,36},{119,42},{114,48},{109,56},{101,64},{92,70},
 {82,75},{75,78},{70,84},{65,89},{68,82},{69,76},{61,80},{53,90},
 {47,102},{47,115},{41,121},{42,106},{38,96}},'hair2','hair0')
-- Far side of the part follows the head volume, then opens around the face.
poly({{123,26},{134,28},{143,34},{148,43},{151,57},{151,74},{148,86},
 {142,94},{139,97},{141,85},{141,74},{137,59},{131,48},{122,42},
 {118,47},{118,40}},'hair1','hair0')
-- Thin near face-framing lock.
poly({{88,66},{84,74},{81,87},{80,99},{81,109},{86,120},{86,130},
 {82,138},{81,138},{84,129},{83,121},{78,111},{75,100},{75,88},{78,77}},'hair2','hair0')
-- Foreground long S-shaped lock; upper shoulder remains behind it.
poly({{52,87},{56,94},{55,108},{50,128},{45,146},{43,162},{44,174},
 {50,184},{60,190},{71,193},{80,192},{76,195},{66,196},{53,193},
 {43,187},{37,179},{34,169},{35,154},{40,135},{44,116},{45,102}},'hair2','hair0')
poly({{38,171},{43,184},{40,198},{36,211},{35,226},{38,237},{45,246},
 {52,250},{44,249},{35,244},{29,235},{26,225},{27,213},{31,195}},'hair1','hair0')
-- Far lock turns out over the shoulder.
poly({{145,93},{150,97},{151,110},{147,121},{144,131},{146,137},
 {153,140},{161,138},{157,144},{149,146},{140,143},{134,137},
 {132,130},{134,119},{140,106}},'hair2','hair0')
-- Restrained crown curl, connected at its base.
poly({{91,17},{88,13},{90,9},{95,6},{103,6},{109,8},{111,11},{110,14},
 {107,15},{109,11},{105,9},{100,9},{96,11},{94,15},{97,17}},'hair1','hair0')

layer('10 Accessories')
local guide=layer('11 Construction guides - hidden',STAGE==2)
fpath({{20,-29},{20,-13},{20,0},{23,13},{16,24},{18,39}},'teal2')
fpath({{-18,0},{40,0}},'teal3')
for _,v in ipairs({{F.nose,7},{F.mouth,10},{F.chin,5}}) do
 el(v[1],{{-v[2],0},{v[2],0}},'teal2')
 el(v[1],{{0,-2},{0,2}},'teal3')
end
for _,b in ipairs(buffers) do s:newCel(b.l,1,b.im,Point(0,0)) end
guide.isVisible=STAGE==2
s:saveAs(ROOT..STEM..'.aseprite')
local native=Image(W,H,ColorMode.RGB); native:clear(0); native:drawSprite(s,1)
native:saveAs(ROOT..STEM..'.png')
local function enlarge(src,scale,bg)
 local result=Image(src.width*scale,src.height*scale,ColorMode.RGB)
 for y=0,result.height-1 do for x=0,result.width-1 do
  local v=src:getPixel(math.floor(x/scale),math.floor(y/scale))
  if bg and app.pixelColor.rgbaA(v)==0 then v=bg end
  result:drawPixel(x,y,v)
 end end
 return result
end
enlarge(native,4):saveAs(ROOT..STEM..'_4x.png')
local crop=Image(96,92,ColorMode.RGB)
for y=0,91 do for x=0,95 do crop:drawPixel(x,y,native:getPixel(x+56,y+38)) end end
enlarge(crop,8):saveAs(ROOT..STEM..'_face_8x.png')
enlarge(native,4,app.pixelColor.rgba(236,232,221,255)):saveAs(ROOT..STEM..'_light.png')
enlarge(native,4,app.pixelColor.rgba(20,23,33,255)):saveAs(ROOT..STEM..'_dark.png')
local src=assert(io.open(ROOT..'construct.lua','rb')); local code=src:read('*a'); src:close()
local snap=assert(io.open(ROOT..STEM..'.lua','wb')); snap:write(code); snap:close()
local log=assert(io.open(ROOT..STEM..'_build.txt','w'))
log:write('Built with Aseprite ',tostring(app.version),'\nStage ',STAGE,'\n192x256 indexed, 32 opaque palette entries + transparency.\n')
log:close(); s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/mira_192_v001/error.txt','w')); f:write(tostring(err)); f:close(); error(err)
end
