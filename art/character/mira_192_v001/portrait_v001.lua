-- Mira: direct native pixel construction. Run from the repository root.
-- Aseprite --batch --script-param stage=1 --script this-file.lua
-- Stages 1..5: silhouette, construction, face, material, accessories.
-- No reference pixels are loaded. No image generation, tracing or resampling.
local function main()
local W,H=192,256
local ROOT='art/character/mira_192_v001/'
local STAGE=tonumber(app.params.stage or '5')
local REV=app.params.revision or '001'
local STEM=STAGE<5 and ('stage0'..STAGE..(app.params.review and ('_'..app.params.review) or '')) or ('portrait_v'..REV)
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
if STAGE>=4 then
 poly({{46,82},{51,91},{48,106},{43,122},{42,138},{35,155},{28,169},
  {24,180},{27,168},{29,151},{36,132},{38,113},{37,99}},'hair2')
 poly({{45,107},{43,124},{38,141},{31,157},{30,149},{35,133},{38,118}},'hair3')
 path({{41,118},{38,133},{33,143}},'hair4')
 poly({{23,190},{23,206},{17,224},{14,237},{17,245},{25,251},{19,249},
  {12,240},{13,228},{18,213}},'hair2')
 path({{17,224},{14,234},{15,241},{19,245}},'hair3')
 poly({{149,82},{149,99},{145,110},{144,121},{149,131},{157,136},
  {149,135},{139,127},{138,115},{142,101}},'hair0')
 path({{151,91},{154,102},{152,114},{157,126},{162,132}},'hair2')
 path({{155,116},{157,123},{159,125}},'hair3')
end

layer('02 Clothing - black knit')
poly({{75,119},{102,118},{111,126},{120,135},{135,159},{145,192},{147,220},
 {141,242},{147,255},{39,255},{40,231},{44,204},{45,180},{52,153},{61,134}},'top1','ink')
if STAGE>=4 then
 poly({{77,144},{87,152},{99,154},{110,149},{118,156},{121,174},
  {130,190},{135,208},{131,223},{122,236},{111,241},{95,239},{73,231},
  {60,218},{57,202},{62,182},{67,169}},'top2')
 poly({{69,164},{76,160},{76,174},{69,191},{67,207},{70,219},{61,216},
  {59,203},{62,185}},'top1')
 poly({{91,159},{96,164},{91,181},{86,199},{87,219},{84,226},
  {80,220},{81,199},{86,182}},'top1')
 poly({{105,159},{110,160},{116,179},{119,198},{119,215},{116,224},
  {115,202},{112,181}},'top1')
 poly({{127,183},{135,198},{139,213},{136,225},{127,231},{130,215},{128,201}},'top0')
 poly({{57,215},{64,225},{80,230},{101,229},{121,226},{133,219},
  {130,235},{117,244},{103,249},{94,255},{57,255},{54,239}},'top0')
 poly({{59,236},{75,237},{90,232},{105,231},{114,234},{99,236},
  {86,244},{76,245},{62,242}},'top1')
 poly({{94,242},{104,238},{113,238},{123,242},{118,247},{104,249},{100,255},{96,255}},'top2')
 path({{66,169},{62,183},{59,197},{59,208}},'top3')
 path({{76,168},{72,180},{69,194},{70,202}},'top3')
 path({{100,163},{104,180},{107,199},{107,215}},'top3')
 path({{85,208},{85,220},{89,228}},'top3')
 path({{71,244},{79,247},{87,246}},'top2')
end

layer('03 Clothing - plum blazer')
poly({{68,133},{76,131},{75,144},{63,163},{55,184},{51,211},{55,234},
 {63,255},{14,255},{15,244},{12,226},{14,208},{13,185},{14,165},{17,156},
 {25,152},{38,150},{53,144}},'plum2','plum0')
poly({{112,124},{122,132},{139,139},{154,137},{166,138},{174,144},
 {179,157},{178,179},{181,200},{178,215},{183,232},{185,255},
 {137,255},{140,239},{140,221},{135,198},{127,171},{119,147}},'plum2','plum0')
if STAGE>=4 then
 -- Near shoulder, fitted sleeve and restrained elbow folds.
 poly({{18,159},{24,155},{40,153},{48,149},{42,162},{32,177},
  {27,195},{28,213},{24,218},{20,204},{18,181}},'plum3')
 poly({{17,170},{20,190},{24,210},{22,219},{17,228},{15,219},{16,201}},'plum1')
 poly({{28,169},{34,164},{33,178},{28,194},{30,207},{28,215},{25,205},{25,188}},'plum1')
 path({{19,161},{20,173},{22,183}},'plum4')
 path({{31,162},{27,171},{27,180}},'plum2')
 poly({{16,231},{22,225},{29,227},{39,238},{45,248},{47,255},{35,255},
  {31,245},{27,239},{20,238}},'plum1')
 poly({{15,247},{22,241},{28,243},{35,255},{19,255}},'plum3')
 path({{18,231},{23,229},{30,232}},'plum4')
 path({{19,244},{24,241},{29,244}},'plum4')
 -- Near notched lapel continues beneath the S-shaped hair lock.
 poly({{72,131},{78,135},{70,148},{60,159},{56,169},{48,165},
  {53,153},{60,141}},'plum3','plum0')
 path({{73,134},{67,146},{58,155},{51,161}},'plum4')
 poly({{57,169},{65,162},{58,181},{54,200},{53,220},{58,239},
  {66,255},{54,255},{47,238},{44,219},{46,197},{50,180}},'plum2','plum0')
 path({{57,179},{52,199},{51,220},{56,239},{60,247}},'plum3')
 -- Far shoulder seam and sleeve: highlights follow cloth tension.
 poly({{151,140},{161,139},{168,143},{172,151},{174,169},{171,185},
  {174,199},{170,211},{172,225},{181,244},{182,255},{166,255},
  {160,238},{158,221},{159,197},{158,174},{151,157}},'plum3')
 poly({{169,148},{174,161},{174,178},{171,192},{166,199},{166,182},
  {167,165}},'plum2')
 poly({{170,181},{172,195},{176,205},{172,214},{166,219},{168,230},
  {175,240},{177,250},{170,244},{163,233},{162,224},{164,211}},'plum1')
 path({{169,146},{172,151},{173,161},{172,168}},'plum4')
 path({{162,155},{159,162},{160,177},{162,186}},'plum1')
 poly({{166,217},{170,219},{177,228},{179,239},{175,232},{169,225},
  {164,225},{160,230}},'plum0')
 poly({{161,234},{166,230},{171,232},{178,243},{179,250},{173,241},
  {167,237},{160,239}},'plum2')
 path({{160,230},{166,226},{171,229}},'plum4')
 path({{165,241},{169,240},{174,245}},'plum4')
 -- Broad far lapel with a clear notch and dark fold underneath.
 poly({{111,124},{120,131},{128,143},{139,151},{146,155},{140,160},
  {133,165},{126,162},{120,152},{115,137}},'plum3','plum0')
 poly({{112,127},{116,135},{121,150},{127,159},{132,162},{127,161},
  {119,154},{114,142}},'plum2')
 path({{122,138},{129,147},{142,155},{134,161}},'plum4')
 poly({{133,166},{143,164},{142,179},{143,193},{147,214},{144,232},
  {146,247},{150,255},{134,255},{138,239},{136,223},{133,207},{128,184},{123,164}},'plum2','plum0')
 poly({{139,170},{140,185},{139,197},{143,216},{140,232},{140,242},
  {137,238},{138,222},{134,201},{132,185}},'plum3')
 path({{141,170},{141,187},{140,196},{144,215},{141,232}},'plum4')
 path({{127,171},{131,185},{133,198}},'plum1')
 -- A slim welt pocket and one quiet button at the waist.
 path({{145,198},{154,196},{157,197}},'plum0')
 path({{145,199},{154,197}},'plum3')
 poly({{140,232},{142,232},{143,234},{142,236},{140,236},{139,234}},'plum0')
 line(140,233,141,233,'silver0')
end

layer('04 Neck')
poly({{76,98},{106,108},{114,116},{108,126},{99,133},{87,132},{76,126}},'skin3')
if STAGE>=3 then
 poly({{77,101},{85,108},{95,117},{108,119},{106,126},{100,129},{87,123},{80,115}},'skin0')
 poly({{77,109},{84,119},{96,128},{101,131},{86,130},{78,125}},'skin2')
end
-- High collar occludes the neck base and follows the shoulder tilt.
poly({{74,123},{83,126},{94,127},{104,124},{109,121},{114,132},{113,142},
 {104,148},{94,150},{82,146},{76,139}},'top0','ink')
if STAGE>=4 then
 poly({{76,125},{81,128},{82,135},{88,141},{97,143},{106,139},
  {111,130},{113,133},{112,141},{104,146},{94,148},{83,144},{78,138}},'top1')
 path({{83,129},{84,138},{88,141}},'top2')
 path({{90,129},{91,136},{94,141}},'top1')
 path({{102,127},{105,132},{104,138}},'top2')
 path({{80,140},{86,145},{96,148},{103,146}},'top2')
 path({{92,142},{100,143},{107,139}},'top2')
end

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
 poly({{121,96},{127,95},{132,92},{131,95},{127,99},{123,100}},'skin5')
 poly({{101,114},{106,115},{112,114},{109,116},{104,116}},'skin5')
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
 ep(E,{{-8,0},{-5,-1},{0,-2},{5,-1},{8,1},{5,3},{0,3},{-5,2}},'silver2')
 ep(E,{{-2,-2},{3,-1},{4,1},{2,3},{0,3},{-3,1}},'teal0')
 ep(E,{{-2,0},{3,0},{2,3},{0,3},{-2,1}},'teal1')
 el(E,{{-1,2},{2,2}},'teal2')
 el(E,{{1,-1},{1,1}},'hair0')
 el(E,{{-1,0},{0,0}},'teal3')
 el(E,{{-8,0},{-5,-2},{0,-3},{5,-2},{8,0},{9,-1}},'ink')
 el(E,{{-5,-1},{-2,-2},{3,-2},{7,0}},'ink')
 el(E,{{-4,3},{1,4},{5,3}},'skin1')
 el(E,{{-6,-6},{-2,-7},{3,-7},{6,-5}},'skin1')
 el(E,{{-8,-10},{-3,-12},{2,-12},{6,-10}},'hair1')
 el(E,{{-3,-11},{2,-11},{6,-9}},'hair2')
end
layer('07 Nose and mouth')
if STAGE>=3 then
 -- Nose stays immediately below the bridge on the shared curved centerline.
 ep(F.nose,{{0,-2},{1,0},{0,1},{-2,1}},'skin2')
 el(F.nose,{{-1,1},{0,1}},'skin1')
 el(F.nose,{{1,-2},{1,-1}},'skin5')
 -- Closed smile with one lifted corner; no isolated tooth-white pixels.
 ep(F.mouth,{{-6,0},{-1,1},{5,0},{3,2},{0,2},{-3,1}},'lip')
 el(F.mouth,{{-8,-2},{-6,-1},{-2,0},{2,0},{6,-1},{8,-2}},'lip0')
 el(F.mouth,{{-6,-1},{-2,0},{1,0}},'skin0')
 el(F.mouth,{{0,2},{3,2}},'blush')
end
layer('08 Glasses')
if STAGE>=3 then
 fpath({{-15,-6},{-8,-7},{4,-7},{15,-5},{17,-2},{16,5},{13,8},
  {8,10},{-7,11},{-12,8},{-14,1}},'ink',true)
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
 {129,24},{132,30},{124,36},{119,42},{114,48},{109,55},{101,61},{92,66},
 {82,70},{75,75},{70,81},{65,89},{68,82},{69,76},{61,80},{53,90},
 {47,102},{47,115},{41,121},{42,106},{38,96}},'hair2','hair0')
if STAGE>=4 then
 -- Crown bands share the sweep, with broken tapered tips instead of noise.
 poly({{41,69},{44,54},{52,41},{65,31},{79,24},{96,19},{107,19},
  {94,22},{80,28},{68,36},{57,46},{48,59},{43,74},{41,89}},'hair1')
 poly({{48,54},{55,42},{66,33},{81,26},{95,22},{101,22},{87,28},
  {73,36},{62,46},{53,58},{46,69}},'hair3')
 poly({{55,46},{63,38},{73,32},{84,28},{88,28},{76,35},{66,43},{60,48},
  {57,48},{50,58}},'hair4')
 path({{63,41},{69,36},{77,32}},'hair5')
 poly({{70,26},{85,20},{100,17},{112,18},{121,22},{126,26},
  {119,24},{111,22},{98,21},{88,22},{78,25}},'hair3')
 path({{92,18},{101,17},{111,18},{116,20}},'hair4')
 -- Dark separations turn around the part, not across the forehead.
 poly({{47,77},{57,64},{70,51},{83,40},{98,29},{111,25},{119,27},
  {105,29},{95,35},{85,43},{76,54},{68,62},{59,69}},'hair1')
 poly({{46,87},{57,75},{70,66},{83,56},{95,44},{107,35},{119,31},
  {126,32},{117,36},{109,43},{103,51},{96,58},{87,63},{76,68},
  {68,74},{57,82}},'hair3')
 poly({{64,69},{75,58},{88,48},{99,38},{107,35},{110,35},
  {102,42},{96,48},{96,50},{88,55},{83,58},{83,60},{74,65}},'hair4')
 poly({{78,56},{85,50},{91,47},{88,51},{87,53},{82,57}},'hair5')
 poly({{91,45},{94,42},{99,40},{96,44},{93,46}},'hair5')
 path({{55,77},{68,69},{77,64},{89,59},{98,52}},'hair1')
 path({{52,87},{56,80},{64,76}},'hair4')
 poly({{43,89},{48,81},{46,94},{44,105},{44,114},{42,118},{43,105},{41,98}},'hair3')
 path({{40,67},{39,77},{40,86}},'hair3')
end
-- Far side of the part follows the head volume, then opens around the face.
poly({{123,26},{134,28},{143,34},{148,43},{151,57},{151,74},{148,86},
 {142,94},{139,97},{141,85},{141,74},{137,59},{131,48},{122,42},
 {118,47},{118,40}},'hair1','hair0')
if STAGE>=4 then
 poly({{127,29},{137,32},{144,39},{148,52},{149,65},{147,78},
  {145,83},{146,68},{145,56},{141,45},{133,37},{127,35}},'hair2')
 poly({{132,32},{140,36},{145,44},{146,51},{144,49},{140,41},{136,38}},'hair3')
 path({{136,34},{141,38},{144,43}},'hair4')
 poly({{122,37},{129,40},{135,49},{139,59},{141,71},{140,75},
  {136,60},{131,51},{124,45},{120,44}},'hair0')
 path({{144,64},{146,72},{144,84},{141,90}},'hair3')
end
-- Thin near face-framing lock.
poly({{84,67},{81,74},{79,87},{79,99},{81,109},{86,120},{86,130},
 {82,138},{81,138},{84,129},{83,121},{78,111},{75,100},{75,88},{77,77}},'hair2','hair0')
if STAGE>=4 then
 poly({{81,73},{79,83},{78,96},{78,103},{77,98},{77,86}},'hair4')
 path({{78,105},{80,112},{85,122},{85,130},{82,135}},'hair3')
 path({{78,88},{78,95}},'hair5')
end
-- Foreground long S-shaped lock; upper shoulder remains behind it.
poly({{52,87},{56,94},{55,108},{50,128},{45,146},{43,162},{44,174},
 {50,184},{60,190},{71,193},{80,192},{76,195},{66,196},{53,193},
 {43,187},{37,179},{34,169},{35,154},{40,135},{44,116},{45,102}},'hair2','hair0')
if STAGE>=4 then
 poly({{51,99},{51,112},{46,132},{41,151},{38,166},{39,177},
  {45,185},{53,190},{49,189},{40,183},{36,175},{36,164},{40,144},
  {45,127},{47,112}},'hair3')
 poly({{47,116},{47,127},{43,142},{40,155},{38,168},{38,173},
  {37,168},{39,150},{43,134}},'hair4')
 path({{42,142},{40,151},{39,156}},'hair5')
 poly({{42,158},{42,171},{47,181},{57,188},{68,192},{76,193},
  {67,194},{56,190},{45,183},{40,174},{40,166}},'hair1')
 path({{42,177},{48,185},{59,191},{69,193},{77,193}},'hair3')
 path({{47,97},{48,107},{46,120}},'hair1')
end
poly({{38,171},{43,184},{40,198},{36,211},{35,226},{38,237},{45,246},
 {52,250},{44,249},{35,244},{29,235},{26,225},{27,213},{31,195}},'hair1','hair0')
if STAGE>=4 then
 poly({{37,186},{38,194},{33,211},{31,223},{32,234},{38,243},
  {43,246},{38,244},{31,238},{28,228},{29,215},{33,199}},'hair3')
 poly({{34,203},{34,208},{31,221},{31,229},{30,229},{29,223},{31,211}},'hair4')
 path({{32,235},{36,241},{42,246},{47,248}},'hair2')
end
-- Far lock turns out over the shoulder.
poly({{145,93},{150,97},{151,110},{147,121},{144,131},{146,137},
 {153,140},{161,138},{157,144},{149,146},{140,143},{134,137},
 {132,130},{134,119},{140,106}},'hair2','hair0')
if STAGE>=4 then
 poly({{146,103},{146,112},{140,126},{140,135},{144,141},{152,144},
  {147,144},{139,140},{136,134},{136,126},{141,114}},'hair3')
 poly({{143,114},{141,123},{138,129},{139,134},{137,131},{138,123}},'hair4')
 path({{140,137},{145,141},{152,142},{156,141}},'hair4')
 path({{148,103},{148,111},{144,121}},'hair1')
end
-- Restrained crown curl, connected at its base.
poly({{91,17},{88,13},{90,9},{95,6},{103,6},{109,8},{111,11},{110,14},
 {107,15},{109,11},{105,9},{100,9},{96,11},{94,15},{97,17}},'hair1','hair0')
if STAGE>=4 then path({{91,13},{93,10},{98,8},{104,8},{108,10}},'hair3') end

layer('10 Accessories')
if STAGE>=5 then
 -- Orbit hairpin, with a tiny state-vector terminal. Dark underlay separates
 -- the silver pixels from the indigo hair without a bright outer halo.
 poly({{58,43},{63,42},{67,45},{69,50},{68,55},{64,59},{59,59},
  {54,55},{53,49},{55,45}},'hair0','ink')
 path({{58,44},{63,43},{66,45},{68,49},{68,54},{64,58},{59,58},
  {55,54},{54,49},{56,46}},'silver0',true)
 path({{57,46},{60,44},{64,44},{67,47},{67,51}},'silver2')
 path({{55,50},{56,54},{59,57},{63,57},{66,55}},'silver1')
 path({{59,44},{57,49},{58,55},{62,58},{65,54},{65,48},{62,44}},'silver1')
 path({{54,51},{57,48},{61,47},{65,48},{68,51},{65,54},{60,55},{56,54}},'silver0',true)
 path({{54,51},{58,48},{62,48}},'silver2')
 path({{62,54},{65,53},{67,51}},'silver1')
 rect(59,49,4,4,'teal0'); rect(60,49,3,3,'teal2')
 line(60,49,61,49,'teal3'); px(60,49,'silver2'); px(62,52,'teal1')
 path({{62,49},{64,46},{66,42}},'silver1')
 poly({{65,40},{67,40},{68,42},{66,44},{64,42}},'teal0','hair0')
 rect(65,41,2,2,'teal2'); px(65,41,'silver2')
 -- Near and far drop earrings, placed at their ear attachments.
 poly({{66,92},{68,92},{69,94},{67,96},{65,94}},'silver0','ink')
 px(67,93,'silver2'); px(67,94,'teal3')
 line(67,96,67,100,'silver1')
 poly({{67,99},{70,102},{67,105},{64,102}},'silver0','ink')
 path({{67,100},{69,102},{67,104},{65,102}},'silver1',true)
 px(67,102,'teal2'); px(66,101,'silver2')
 line(67,105,67,108,'silver1'); px(67,108,'silver2')
 line(135,105,135,109,'silver0')
 poly({{135,108},{137,110},{135,112},{134,110}},'silver1','ink')
 px(135,110,'teal2'); line(135,112,135,114,'silver1')
 -- Fine chain and compact sphere pendant.
 path({{77,142},{82,148},{88,153},{95,158},{100,155},{105,149},{110,141}},'silver0')
 path({{78,143},{82,148},{88,153},{94,157}},'silver1')
 path({{98,156},{102,152},{106,146},{108,143}},'silver2')
 line(95,158,95,160,'silver1')
 poly({{92,159},{97,159},{100,162},{100,166},{97,169},{92,169},{89,166},{89,162}},'top0','ink')
 path({{92,160},{96,159},{99,162},{99,165},{97,168},{92,168},{90,165},{90,162}},'silver0',true)
 path({{91,162},{93,160},{96,160},{98,162}},'silver2')
 path({{90,165},{93,168},{97,167},{99,164}},'silver1')
 path({{93,160},{92,163},{93,167},{96,168},{98,164},{96,160}},'silver1')
 path({{90,164},{94,162},{98,163},{99,165},{95,166},{91,165}},'silver0')
 rect(93,162,4,4,'teal0'); rect(94,162,2,3,'teal2')
 px(94,162,'silver2'); px(95,163,'teal3'); px(95,165,'teal1')
 -- Small quantum pin on the far lapel: three crossing orbits, no letters.
 path({{135,176},{137,172},{140,171},{141,174},{140,181},{137,183},{135,180}},'ink',true)
 path({{135,176},{136,172},{139,171},{140,173},{139,180},{137,182},{135,180}},'silver1',true)
 path({{132,176},{136,175},{141,177},{143,179},{140,180},{135,179},{132,177}},'silver0',true)
 path({{133,176},{137,176},{141,178}},'silver2')
 path({{134,181},{136,177},{140,173}},'silver0')
 rect(136,176,2,2,'teal2'); px(136,176,'silver2')
end
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
