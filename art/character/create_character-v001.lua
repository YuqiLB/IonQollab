-- Original character: Mira, a quantum-computing graduate researcher.
-- Drawn on the native 128x192 grid; no external images, AA, or resampling.
-- API: https://aseprite.org/api/image and https://aseprite.org/api/sprite
-- Reruns always select an unused version. Canonical files are created only
-- when absent, so hand-edited .aseprite files are never overwritten.
local W,H = 128,192
local colors = {
  '222438', -- 1 ink
  '343850', -- 2 soft outline / shirt shadow
  '304576', -- 3 hair deep
  '355C99', -- 4 hair shadow
  '447CC0', -- 5 hair base
  '65A4DF', -- 6 hair light
  '9AD1EC', -- 7 hair glint
  '9F626C', -- 8 skin deepest / mouth
  'C18080', -- 9 skin shadow
  'DDA08F', -- 10 skin half-tone
  'EFC0A5', -- 11 skin base
  'FFDBB9', -- 12 skin light
  'E6A09A', -- 13 blush
  '938B91', -- 14 cardigan deep
  'B7AEAC', -- 15 cardigan shadow
  'DBD2C2', -- 16 cardigan base
  'F3ECD9', -- 17 cardigan light
  '4C536B', -- 18 shirt
  '69758B', -- 19 shirt light
  '358D9A', -- 20 teal shadow
  '71D8CD', -- 21 teal
  'D0F4DD', -- 22 eye white / clip light
  'C8975F', -- 23 brass
  'F3CD81', -- 24 brass light
}
local C = {}
local pal = Palette(#colors+1)
pal:setColor(0,Color{r=0,g=0,b=0,a=0})
for i,h in ipairs(colors) do
  local r,g,b = tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16)
  pal:setColor(i,Color{r=r,g=g,b=b,a=255})
  C[i]=app.pixelColor.rgba(r,g,b,255)
end
local s = Sprite(W,H,ColorMode.INDEXED)
s:setPalette(pal)
s.transparentColor=0
s.data='Mira / neutral. Original pixel art. 24 opaque colors + transparency. Native 128x192.'
local buffers={}
local im
local function layer(name)
  local l
  if #buffers==0 then l=s.layers[1] else l=s:newLayer() end
  l.name=name
  im=Image(W,H,ColorMode.INDEXED)
  im:clear(0)
  buffers[#buffers+1]={layer=l,image=im}
end
local function px(x,y,c)
  if x>=0 and x<W and y>=0 and y<H then im:drawPixel(x,y,c) end
end
local function line(x0,y0,x1,y1,c)
  local dx,dy=math.abs(x1-x0),-math.abs(y1-y0)
  local sx,sy=x0<x1 and 1 or -1,y0<y1 and 1 or -1
  local err=dx+dy
  while true do
    px(x0,y0,c)
    if x0==x1 and y0==y1 then break end
    local e=2*err
    if e>=dy then err=err+dy; x0=x0+sx end
    if e<=dx then err=err+dx; y0=y0+sy end
  end
end
local function path(p,c,closed)
  for i=1,#p-1 do line(p[i][1],p[i][2],p[i+1][1],p[i+1][2],c) end
  if closed then line(p[#p][1],p[#p][2],p[1][1],p[1][2],c) end
end
local function poly(p,c,edge)
  local ymin,ymax=H,0
  for _,v in ipairs(p) do ymin=math.min(ymin,v[2]); ymax=math.max(ymax,v[2]) end
  for y=ymin,ymax do
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
-- Discrete hand-stepped loops rather than antialiased ellipse tools.
local function lens(cx,cy,rx,ry,c)
  path({{cx-rx+3,cy-ry},{cx+rx-3,cy-ry},{cx+rx-1,cy-ry+2},
    {cx+rx,cy-ry+5},{cx+rx,cy+ry-4},{cx+rx-2,cy+ry-1},
    {cx+rx-5,cy+ry},{cx-rx+4,cy+ry},{cx-rx+1,cy+ry-2},
    {cx-rx,cy+ry-5},{cx-rx,cy-ry+4},{cx-rx+1,cy-ry+2}},c,true)
end

layer('01 Back hair')
poly({{27,113},{31,99},{27,81},{27,47},{31,31},{39,21},{52,15},{68,13},{82,16},{92,23},{98,35},{99,52},{96,77},{99,103},{106,121},{96,126},{82,116},{43,125}},3,1)
poly({{30,53},{34,32},{45,23},{60,18},{78,18},{91,27},{95,42},{91,62},{90,90},{98,116},{86,109},{73,105},{45,118},{33,113},{37,95}},4)
poly({{31,49},{35,35},{42,27},{40,57},{37,84},{40,107},{35,111},{31,94}},5)
poly({{88,29},{95,39},{96,56},{92,81},{94,101},{91,97},{87,72}},5)
path({{31,75},{31,92},{34,104}},2)
path({{94,88},{96,110},{101,119}},2)

layer('02 Body and clothing')
-- Neck and relaxed, slightly uneven shoulders.
poly({{57,89},{79,90},{80,106},{88,113},{78,129},{53,125},{45,112},{57,106}},11,1)
poly({{57,91},{79,92},{78,101},{65,109},{57,105}},9)
poly({{62,106},{70,108},{78,104},{79,113},{71,119},{61,114}},12)
poly({{45,109},{56,115},{68,121},{80,112},{90,114},{106,122},{114,146},{118,191},{13,191},{15,147},{22,124}},16,1)
-- Dark scoop-neck shirt, center opening of cardigan.
poly({{47,114},{58,118},{69,124},{80,115},{91,119},{94,147},{94,191},{43,191},{42,139}},18,2)
poly({{50,118},{58,122},{68,127},{77,123},{83,118},{86,123},{77,129},{65,132},{54,128}},2)
path({{52,121},{58,125},{67,129},{76,127},{81,123}},19)
poly({{53,136},{59,142},{62,163},{57,191},{45,191},{45,161}},2)
poly({{69,139},{78,137},{85,151},{88,184},{81,179},{77,158}},19)
-- Near sleeve and cardigan panels.
poly({{43,112},{51,114},{48,136},{51,158},{46,177},{47,191},{14,191},{16,152},{21,131},{29,120}},16,1)
poly({{28,122},{41,116},{44,120},{39,140},{40,165},{36,190},{18,190},{20,148}},17)
poly({{42,122},{47,119},{44,138},{48,157},{42,181},{44,191},{36,191},{39,163},{37,145}},15)
poly({{19,153},{24,142},{24,160},{28,170},{25,187},{18,191},{15,191}},15)
path({{28,144},{27,159},{31,169}},14)
path({{23,178},{29,177},{34,180}},15)
-- Rolled opening and asymmetric far sleeve.
poly({{83,112},{93,115},{104,122},{110,138},{115,167},{117,191},{91,191},{87,165},{88,142},{81,126}},16,1)
poly({{92,120},{102,125},{107,142},{111,166},{111,182},{102,178},{100,153}},17)
poly({{86,122},{91,132},{94,149},{92,168},{98,191},{90,191},{86,165},{88,144},{81,127}},15)
path({{83,118},{86,127},{90,139},{91,157},{89,168}},17)
path({{104,147},{102,161},{105,170}},15)
path({{113,181},{103,183},{99,181}},14)
-- Small pocket, a teal mechanical pencil, and brass cardigan buttons.
rect(27,156,3,13,20); rect(28,154,2,7,21); px(29,153,23)
poly({{24,165},{36,166},{35,178},{31,181},{25,179}},16,15)
line(25,167,35,168,17)
for _,y in ipairs({146,169,186}) do rect(43,y,3,4,14); rect(43,y,2,2,23); px(44,y,24) end

layer('03 Face')
poly({{48,41},{63,31},{79,33},{88,41},{93,52},{92,66},{97,75},{93,79},{92,86},{85,94},{76,100},{66,99},{55,92},{47,82},{43,66}},11,8)
poly({{48,42},{57,38},{55,57},{51,67},{54,80},{60,88},{70,94},{79,96},{75,99},{66,97},{56,91},{48,81},{44,65}},10)
poly({{61,43},{75,37},{86,43},{89,56},{87,68},{90,77},{85,83},{76,84},{63,78},{58,63}},12)
-- Near ear, tucked behind the glasses arm.
poly({{44,65},{48,64},{52,69},{52,78},{49,82},{44,78},{42,72}},11,8)
path({{45,69},{47,68},{49,71},{47,75},{49,77}},9)
-- Nose points toward the chat interface.
path({{88,66},{88,70},{92,75},{89,77},{86,76}},10)
line(90,77,92,77,8); px(94,75,12)
rect(56,77,7,2,13); rect(59,79,6,1,13)
rect(86,79,5,2,13)
-- Small closed, asymmetric smile: warm neutral with a playful corner.
path({{72,86},{76,87},{81,87},{84,85}},8)
line(75,88,80,88,9); line(76,91,80,91,12); px(84,84,9)

layer('04 Eyes')
-- Separate brows and upper-lid clusters keep the expression editable.
path({{55,55},{58,53},{63,53},{67,54}},4)
path({{79,53},{82,52},{86,53},{88,54}},4)
poly({{54,63},{57,60},{63,60},{68,63},{67,68},{58,69},{54,67}},22)
poly({{79,62},{82,60},{86,61},{89,64},{87,68},{81,68},{78,65}},22)
rect(61,61,5,8,20); rect(63,61,3,6,3); rect(63,62,2,4,1)
rect(83,61,4,7,20); rect(85,62,2,5,3); rect(85,62,1,4,1)
rect(62,61,2,2,22); px(84,61,22); line(62,68,64,68,21); px(84,67,21)
path({{53,62},{56,60},{62,59},{66,60},{68,62}},1)
path({{78,62},{81,59},{85,59},{88,61},{89,63}},1)
px(53,61,1); px(88,60,1)
line(56,69,60,70,9); line(81,69,85,69,9)

layer('05 Front hair')
-- Swept fringe with broad, stepped highlight clusters.
poly({{29,51},{31,34},{40,22},{54,16},{69,15},{83,19},{91,28},{96,43},{94,57},{90,62},{88,49},{82,40},{72,33},{68,43},{61,50},{51,55},{55,46},{48,52},{45,66},{43,85},{47,110},{42,128},{36,122},{31,108},{32,87},{28,69}},5,1)
poly({{32,44},{37,30},{49,23},{61,20},{69,20},{55,27},{47,38},{40,57},{36,76},{37,101},{34,111},{33,93},{31,71}},6)
poly({{39,34},{46,28},{57,23},{65,23},{53,29},{46,37},{41,48},{37,56}},7)
poly({{70,21},{81,23},{88,30},{92,39},{92,46},{85,34},{76,29},{65,32},{60,42},{52,48},{57,38},{63,28}},6)
poly({{75,24},{82,26},{87,32},{86,34},{80,29},{73,28}},7)
poly({{69,31},{63,42},{54,49},{51,54},{61,49},{68,43},{72,34},{82,41},{88,51},{90,59},{92,60},{90,44},{83,35},{75,30}},4)
poly({{39,61},{39,84},{44,110},{41,121},{38,116},{35,98},{36,78}},4)
path({{41,90},{44,107},{42,118}},6)
path({{30,54},{29,69},{32,79}},3)
-- One restrained flyaway gives her a slightly awkward silhouette.
path({{54,17},{55,11},{59,8},{64,8},{67,10}},1)
path({{57,16},{57,12},{60,10},{64,10}},5)

layer('06 Accessories')
-- Round navy frames; open lenses retain the face's native colors.
lens(61,65,11,11,2)
lens(84,65,9,10,2)
path({{72,64},{74,63},{75,64}},2)
path({{49,64},{45,63},{43,65}},2)
path({{52,57},{55,54},{63,54}},19)
path({{79,56},{82,55},{86,55}},19)
line(51,63,51,67,23); px(72,63,23); px(75,63,23)
line(92,63,92,66,23)
-- Tiny Bloch-sphere hair accessory, with equator and a state-vector tip.
poly({{35,33},{39,30},{44,31},{47,35},{47,40},{43,44},{38,44},{34,40},{33,36}},3,2)
path({{36,34},{39,32},{43,33},{45,35},{45,40},{42,42},{38,42},{35,39},{35,35}},21)
path({{35,37},{39,35},{43,36},{46,38},{42,40},{38,39},{35,37}},20)
path({{40,32},{39,35},{40,40},{42,42}},21)
line(40,38,45,31,24); path({{42,31},{45,31},{45,34}},24)
rect(39,37,2,2,22)
-- Brass ear stud and quiet quantum ket embroidered on the shirt.
rect(48,78,2,3,23); px(48,78,24)
line(69,150,69,157,21)
path({{74,150},{77,153},{74,157}},21)

for _,b in ipairs(buffers) do
  local old=b.layer:cel(1)
  if old then old.image=b.image else s:newCel(b.layer,1,b.image,Point(0,0)) end
end
local function exists(p) return app.fs.isFile(p) end
app.fs.makeAllDirectories('assets/character')
local version=1
while exists(string.format('art/character/character-v%03d.aseprite',version)) do version=version+1 end
local suffix=string.format('-v%03d',version)
local native=Image(W,H,ColorMode.RGB)
native:clear(0)
local used={}
for y=0,H-1 do for x=0,W-1 do
  local idx=0
  for _,b in ipairs(buffers) do local v=b.image:getPixel(x,y); if v~=0 then idx=v end end
  if idx~=0 then native:drawPixel(x,y,C[idx]); used[idx]=true end
end end
-- Exact nearest-neighbour export: each source pixel becomes a 4x4 block.
local preview=Image(W*4,H*4,ColorMode.RGB)
for y=0,H*4-1 do for x=0,W*4-1 do
  preview:drawPixel(x,y,native:getPixel(math.floor(x/4),math.floor(y/4)))
end end
s:saveAs('art/character/character'..suffix..'.aseprite')
native:saveAs('assets/character/neutral'..suffix..'.png')
preview:saveAs('art/character/preview-4x'..suffix..'.png')
if not exists('art/character/character.aseprite') then s:saveCopyAs('art/character/character.aseprite') end
if not exists('assets/character/neutral.png') then native:saveAs('assets/character/neutral.png') end
if not exists('art/character/preview-4x.png') then preview:saveAs('art/character/preview-4x.png') end
-- Keep the exact generating script alongside each revision.
local source=assert(io.open('art/character/create_character.lua','rb'))
local sourceText=source:read('*a'); source:close()
local snapshot=assert(io.open('art/character/create_character'..suffix..'.lua','wb'))
snapshot:write(sourceText); snapshot:close()
local count=0; for _ in pairs(used) do count=count+1 end
local report=assert(io.open('art/character/validation'..suffix..'.txt','w'))
report:write('Aseprite ',tostring(app.version),'\nCanvas: 128 x 192\nMode: indexed\nLayers: ',#s.layers,
  '\nFrames: ',#s.frames,'\nPalette: 24 opaque + transparent index 0\nVisible opaque colors: ',count,
  '\nPreview: 512 x 768, exact 4x nearest neighbour\nRevision: ',suffix,'\n')
report:close()
s:close()
