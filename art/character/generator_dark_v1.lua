-- Mira / dark-academia redesign. Run from repository root with Aseprite --batch.
-- Starts with the ACTUAL editable character.aseprite, reuses all six layer
-- objects and retains the forehead, temple, ear and upper-cheek source pixels.
-- Native integer pixel construction only. Reference interpreted by hand.
-- One frame, indexed palette, binary alpha. Re-runs select unused revision names.
local function main()
local W,H=128,192
local sourcePath='art/character/character.aseprite'
local s=assert(app.open(sourcePath),'Cannot open original editable sprite')
assert(s.width==W and s.height==H and #s.frames==1)
assert(s.colorMode==ColorMode.INDEXED,'Expected existing indexed source')
local revision=1
while app.fs.isFile('art/character/character_dark_v'..revision..'.aseprite') do revision=revision+1 end
local stem='dark_v'..revision
local backup='art/character/character_before_'..stem..'.aseprite'
assert(not app.fs.isFile(backup),'Refusing to overwrite a preserved original')
s:saveCopyAs(backup)
local old={}
for _,l in ipairs(s.layers) do old[l.name]=l end
local faceSource=Image(W,H,ColorMode.INDEXED)
faceSource:clear(0)
local fc=assert(old['03 Face']:cel(1))
faceSource:drawImage(fc.image,fc.position)
local palette={
 '171724','191A24','171F3F','24325E','304579','455EA2','6477BB',
 '945F69','B67D80','D89D8A','EEC0A4','FFDCBC','D99392',
 '2B2034','423049','5B3C59','78526F','252631','393B49',
 '236978','52BCC9','E9E0D2','8399AA','CFDADF'
}
local pal=Palette(25)
pal:setColor(0,Color{r=0,g=0,b=0,a=0})
for i,h in ipairs(palette) do
 pal:setColor(i,Color{r=tonumber(h:sub(1,2),16),g=tonumber(h:sub(3,4),16),b=tonumber(h:sub(5,6),16),a=255})
end
s:setPalette(pal)
s.transparentColor=0
s.data='Mira / dark academia / neutral base. Derived from character.aseprite. Native 128x192. 24 opaque colors. Reference interpreted manually.'
local buffers={}
local im
local function layer(name,previous,retain)
 local l=previous and assert(old[previous]) or s:newLayer()
 l.name=name
 im=Image(W,H,ColorMode.INDEXED); im:clear(0)
 if retain then im:drawImage(faceSource,Point(0,0)) end
 buffers[#buffers+1]={layer=l,image=im}
end
local function px(x,y,c)
 assert(x==math.floor(x) and y==math.floor(y),'Noninteger drawing coordinate')
 if x>=0 and x<W and y>=0 and y<H then im:drawPixel(x,y,c) end
end
local function line(x0,y0,x1,y1,c)
 local dx,dy=math.abs(x1-x0),-math.abs(y1-y0)
 local sx,sy=x0<x1 and 1 or -1,y0<y1 and 1 or -1
 local e=dx+dy
 while true do
  px(x0,y0,c); if x0==x1 and y0==y1 then break end
  local e2=e*2
  if e2>=dy then e=e+dy; x0=x0+sx end
  if e2<=dx then e=e+dx; y0=y0+sy end
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
  for i,a in ipairs(p) do
   local b=p[i%#p+1]
   if (a[2]<=y and b[2]>y) or (b[2]<=y and a[2]>y) then
    hits[#hits+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2])
   end
  end
  table.sort(hits)
  for i=1,#hits-1,2 do
   for x=math.ceil(hits[i]),math.floor(hits[i+1]) do px(x,y,c) end
  end
 end
 path(p,edge or c,true)
end
local function rect(x,y,w,h,c)
 for yy=y,y+h-1 do for xx=x,x+w-1 do px(xx,yy,c) end end
end

layer('01 Back hair','01 Back hair')
poly({{23,66},{26,44},{32,30},{43,21},{57,16},{72,15},{87,20},{97,31},{101,47},
 {99,64},{96,78},{101,95},{100,108},{108,121},{111,136},{107,150},{111,168},
 {109,181},{101,190},{21,191},{15,186},{10,181},{10,171},{15,155},{17,140},
 {15,131},{21,112},{24,98},{22,84}},3,1)
poly({{28,49},{36,32},{48,23},{70,19},{88,26},{95,38},{97,58},{90,76},{92,96},
 {96,114},{104,128},{105,141},{101,151},{104,175},{97,187},{27,187},{21,175},
 {24,154},{22,133},{29,111},{28,89}},4)
poly({{29,72},{34,65},{34,91},{31,112},{25,130},{26,145},{24,164},{18,177},
 {16,182},{13,178},{15,168},{20,152},{19,133},{24,114},{26,91}},5)
poly({{94,69},{92,89},{97,103},{96,114},{102,126},{107,131},{103,130},
 {97,125},{90,111},{90,99},{86,84}},5)
path({{95,107},{100,120},{105,124}},6)
path({{22,118},{19,132},{20,143}},3)
path({{14,165},{12,173},{13,179}},6)

layer('02 Body and top','02 Body and clothing')
poly({{56,89},{78,91},{79,105},{90,115},{75,131},{49,120},{54,106}},11,1)
poly({{56,90},{76,97},{78,103},{67,111},{56,107}},9)
poly({{55,102},{62,108},{73,110},{80,105},{84,115},{89,132},{94,155},
 {95,178},{87,191},{34,191},{34,158},{41,134},{48,117}},18,1)
-- High neck, fitted without noisy ribbing.
poly({{55,102},{64,107},{73,108},{80,104},{83,115},{77,122},{66,123},{53,117}},2,1)
poly({{75,110},{80,107},{81,115},{76,118},{67,120},{63,119},{74,115}},18)
path({{53,117},{61,122},{71,124},{79,121}},19)
poly({{53,127},{59,130},{52,142},{48,158},{47,174},{52,184},{45,180},
 {41,170},{44,146}},19)
poly({{68,131},{74,131},{82,145},{86,163},{83,175},{78,178},{80,162},{76,146}},19)
poly({{59,139},{59,153},{56,169},{61,180},{70,184},{77,182},{72,188},
 {55,184},{48,173},{51,158}},2)
poly({{44,184},{58,188},{73,189},{87,180},{88,187},{82,191},{42,191}},2)
path({{65,142},{68,156},{67,172}},18)

layer('03 Blazer')
-- Shoulders descend asymmetrically to support the gentle head tilt.
poly({{45,108},{54,110},{47,126},{42,151},{37,175},{42,191},{13,191},
 {12,170},{14,149},{13,130},{17,121},{28,115}},15,1)
poly({{18,124},{29,119},{42,115},{34,138},{28,155},{24,174},{28,191},
 {16,191},{16,166},{18,149}},16)
poly({{19,125},{24,122},{24,141},{21,153},{19,148}},17)
poly({{16,155},{20,162},{22,177},{27,191},{17,191},{14,172}},14)
path({{24,135},{27,150},{25,164}},14)
path({{18,177},{23,174},{26,176}},17)
-- Near notched lapel.
poly({{48,107},{56,106},{51,122},{44,140},{34,147},{36,134},{30,131},
 {40,116}},16,14)
path({{51,110},{46,122},{41,131},{34,133}},17)
poly({{35,144},{43,137},{41,153},{34,170},{33,184},{39,191},{29,191},
 {27,175},{30,158}},16,14)
path({{39,153},{33,170},{32,181}},17)
-- Far shoulder and shaped sleeve.
poly({{82,105},{94,111},{106,113},{113,121},{116,137},{114,155},
 {119,177},{119,191},{85,191},{91,167},{87,140}},15,1)
poly({{98,115},{105,115},{111,122},{111,144},{105,157},{104,169},
 {111,188},{117,190},{100,191},{96,171},{99,147}},16)
poly({{107,120},{110,124},{109,139},{104,151},{105,141}},17)
poly({{113,151},{115,166},{110,174},{105,174},{109,165}},14)
poly({{105,179},{110,177},{116,182},{117,188},{112,184},{105,184},{99,188}},14)
path({{104,178},{110,175},{115,178}},17)
path({{101,187},{107,185},{112,187}},16)
-- Far notched lapel, with broader lit surface.
poly({{80,104},{87,110},{91,119},{100,129},{90,137},{85,134},{81,123},
 {77,109}},16,14)
path({{83,111},{88,122},{96,129},{90,134}},17)
poly({{88,138},{98,136},{96,153},{98,168},{92,185},{85,191},{87,176},
 {89,163},{85,146},{81,132}},16,14)
path({{97,140},{94,152},{96,164},{91,181}},17)
-- One subdued silver fastening at the waist.
rect(89,178,2,3,23); px(89,178,24)

layer('04 Face and ears','03 Face',true)
-- Preserve original forehead/temple/ear pixels. Retouch lower face in-place,
-- removing the previous lateral nose and mouth before drawing separate parts.
rect(93,69,7,20,0)
poly({{54,71},{65,71},{75,70},{88,66},{92,67},{92,77},{91,85},{85,93},
 {76,99},{68,98},{58,91},{52,81}},11)
poly({{55,73},{60,78},{61,84},{67,91},{76,96},{80,96},{75,99},{68,97},
 {59,90},{54,82}},10)
poly({{61,72},{72,73},{80,70},{88,69},{89,78},{86,83},{78,84},{67,81}},12)
path({{92,67},{93,76},{91,86},{85,93},{76,100},{68,99},{58,92}},8)
line(65,96,70,99,9)
rect(56,74,6,2,13); rect(86,77,4,1,13)
-- Muted ear cartilage, inherited silhouette retained.
path({{45,69},{47,68},{49,71},{47,75}},9)

layer('05 Eyes and eyebrows','04 Eyes')
-- Near eye is broader and slightly higher than the far eye.
poly({{53,61},{58,60},{64,61},{69,64},{65,67},{58,66},{54,64}},22)
poly({{79,65},{83,63},{87,64},{90,66},{87,69},{82,69}},22)
poly({{59,61},{64,62},{65,64},{64,66},{60,66},{58,64}},20)
rect(61,62,2,4,3); rect(61,62,1,3,1)
line(59,65,60,65,21); line(62,66,63,66,21); px(60,62,24)
poly({{82,64},{86,65},{87,67},{85,68},{82,68}},20)
rect(84,65,2,3,3); px(84,66,1); px(83,65,24); line(83,68,84,68,21)
-- Broad top-lid clusters provide the half-lidded expression.
path({{52,60},{56,60},{61,60},{65,61},{69,63}},1)
path({{54,61},{59,61},{65,62},{68,63}},1)
path({{78,65},{81,63},{85,63},{88,64},{90,65}},1)
line(80,64,85,64,1); px(52,59,1); px(90,64,1)
path({{55,57},{61,57},{65,58}},9)
path({{80,60},{84,59},{87,60}},9)
line(57,67,63,68,9); line(83,70,86,70,9)
-- Slightly raised near brow, restrained far brow.
path({{55,51},{59,50},{64,51},{68,53}},4)
line(59,51,64,52,4)
path({{80,56},{84,54},{88,55},{91,57}},4)

layer('06 Nose and mouth')
-- Facial centerline: bridge (75,65), projected nose (79,77), mouth
-- center (75,87), chin (76,99). No long slash or detached cheek mark.
poly({{77,71},{78,73},{80,76},{79,78},{76,78},{77,76}},10)
line(77,78,79,78,9); px(79,77,11); px(80,75,12)
-- Closed, quietly flirtatious smirk: asymmetric corners, minimal lower lip.
path({{67,84},{70,86},{75,87},{80,87},{83,85}},8)
poly({{71,87},{76,88},{81,87},{78,90},{75,90}},13)
line(73,87,79,88,9); px(67,83,8); px(83,84,9)
line(73,93,77,93,12)

layer('07 Glasses')
-- Perspective-aligned angular frames. One-pixel rims, open lenses.
path({{51,57},{59,56},{67,58},{73,61},{73,67},{70,72},{66,74},
 {58,73},{54,70},{52,65}},1,true)
path({{78,63},{84,62},{93,64},{94,66},{91,73},{87,76},{81,74},{78,70}},1,true)
path({{73,64},{75,64},{78,65}},1)
path({{51,59},{47,60},{44,64}},1)
line(53,57,58,56,23); line(85,62,89,63,23)
px(74,64,23)

layer('08 Front hair','05 Front hair')
-- Sweeping midnight-blue masses, with highlights restricted to narrow planes.
poly({{26,57},{29,39},{36,28},{48,20},{62,16},{76,16},{87,21},
 {91,27},{96,31},{99,44},{97,60},{92,67},{91,53},{87,41},{78,32},
 {74,43},{65,50},{54,56},{49,67},{43,77},{39,90},{40,103},{34,114},
 {28,116},{31,103},{28,89},{26,73}},4,1)
poly({{29,49},{34,35},{43,27},{56,21},{70,19},{78,21},{62,26},{51,34},
 {42,45},{35,56},{30,65}},5)
poly({{35,38},{42,30},{54,24},{63,23},{52,29},{44,35},{38,43}},6)
poly({{43,35},{49,29},{56,27},{52,31},{46,35}},7)
poly({{32,64},{41,52},{50,46},{60,35},{68,29},{79,26},{84,29},{72,34},
 {66,45},{57,52},{43,61},{35,72},{31,82},{29,75}},5)
poly({{44,51},{51,43},{62,34},{68,32},{62,39},{56,47},{48,52},{37,59}},6)
poly({{55,43},{60,38},{64,36},{61,41},{57,44}},7)
path({{36,58},{46,54},{57,48},{66,38}},3)
poly({{79,26},{88,30},{93,38},{96,49},{94,58},{91,47},{87,38}},5)
poly({{85,30},{89,33},{94,43},{94,48},{90,39}},6)
poly({{73,37},{70,49},{65,56},{57,60},{51,73},{48,86},{48,98},
 {52,113},{51,121},{47,127},{48,118},{46,106},{44,93},{45,79},{50,64},
 {60,50},{66,46}},4,3)
poly({{53,64},{57,59},{54,72},{50,83},{47,89},{48,80}},6)
path({{47,94},{49,108},{52,114},{52,119}},5)
-- Long near lock flows across the lapel; a hooked end breaks the silhouette.
poly({{35,82},{39,91},{39,106},{34,119},{31,130},{31,139},{35,147},
 {44,153},{53,154},{47,157},{38,155},{29,149},{25,140},{25,132},
 {29,116},{30,105},{28,97}},4,3)
poly({{35,99},{36,108},{31,123},{28,135},{30,144},{36,152},{31,150},
 {26,142},{27,131},{31,113}},5)
poly({{31,120},{30,130},{28,136},{29,140},{27,137},{28,128}},6)
path({{34,146},{41,152},{49,155}},5)
-- Second long mass continues toward the waist, separated from plum tailoring.
poly({{28,145},{30,152},{26,164},{25,175},{29,186},{34,191},{26,191},
 {20,181},{19,172},{21,160}},4,3)
poly({{25,153},{26,157},{23,169},{23,179},{27,189},{24,187},{21,179},
 {21,170}},5)
line(22,170,22,178,6)
-- Far lock curls over the far shoulder.
poly({{94,77},{97,85},{98,98},{94,108},{95,115},{101,118},{106,117},
 {101,122},{94,122},{88,117},{87,109},{91,96}},4,3)
poly({{94,87},{95,95},{91,109},{92,116},{96,119},{92,118},{89,113},
 {90,106}},5)
path({{92,110},{92,114},{96,118},{101,119}},6)
-- Restrained crown strand, echoing the reference without copying its pixels.
path({{55,18},{54,13},{57,9},{62,8},{67,9},{69,12},{67,14}},3)
path({{56,17},{56,13},{59,10},{63,10},{66,11}},5)

layer('09 Accessories','06 Accessories')
-- Silver quantum-orbit clip with a tiny cyan center.
path({{37,34},{41,32},{45,34},{46,38},{44,41},{39,42},{35,39},
 {35,36},{37,34}},23)
path({{38,34},{42,34},{44,37},{43,40},{40,41},{37,38},{38,34}},24)
path({{35,38},{39,36},{44,36},{46,38},{42,40},{38,40}},23)
rect(39,36,3,3,20); rect(40,36,2,2,21); px(40,36,24)
line(43,33,45,30,23); rect(44,30,2,2,21); px(45,30,24)
-- Small silver drops, unobtrusive cyan detail.
rect(47,79,2,2,24); line(48,81,48,85,23)
path({{48,84},{50,86},{48,88},{46,86}},24,true); px(48,86,21)
line(90,85,90,89,23); px(90,89,24)
-- Fine chain and simplified Bloch-sphere pendant.
path({{53,118},{58,124},{66,130},{72,133},{77,127},{80,120}},23)
path({{55,120},{60,125},{67,130}},24)
path({{69,133},{73,132},{76,135},{75,140},{72,142},{68,139},{68,136}},23,true)
path({{70,134},{73,133},{75,136},{74,140},{70,140},{69,137}},24)
line(68,137,75,136,23); rect(71,135,3,3,20); rect(71,135,2,2,21); px(71,135,24)

-- Reorder reused and new layer objects; preserve actual editable pixel cels.
for i,b in ipairs(buffers) do
 b.layer.stackIndex=i
 local cel=b.layer:cel(1)
 if cel then cel.image=b.image; cel.position=Point(0,0)
 else s:newCel(b.layer,1,b.image,Point(0,0)) end
end
local retained=0
for y=0,H-1 do for x=0,W-1 do
 local v=faceSource:getPixel(x,y)
 if v~=0 and buffers[4].image:getPixel(x,y)==v then retained=retained+1 end
end end
assert(retained>500,'Expected meaningful source face pixels to be retained')
local output='art/character/character_'..stem..'.aseprite'
s:saveAs(output)
local native=Image(W,H,ColorMode.RGB); native:clear(0); native:drawSprite(s,1)
local large=Image(W*4,H*4,ColorMode.RGB)
for y=0,H*4-1 do for x=0,W*4-1 do
 large:drawPixel(x,y,native:getPixel(math.floor(x/4),math.floor(y/4)))
end end
native:saveAs('assets/character/neutral_'..stem..'.png')
large:saveAs('art/character/preview_'..stem..'_4x.png')
local source=assert(io.open('art/character/create_character_dark_v1.lua','rb'))
local script=source:read('*a'); source:close()
local snap=assert(io.open('art/character/generator_'..stem..'.lua','wb')); snap:write(script); snap:close()
local f=assert(io.open('art/character/build_'..stem..'.txt','w'))
f:write('Built with Aseprite ',tostring(app.version),'\nOriginal: ',sourcePath,'\nPreserved source: ',backup,
 '\nOutput: ',output,'\nUnchanged opaque source-face pixels: ',retained,
 '\nCanvas: 128x192 indexed; 24 opaque colors + transparency; 9 editable layers; 1 frame.\n')
f:close(); s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/dark-error.txt','w')); f:write(tostring(err)); f:close()
 error(err)
end
