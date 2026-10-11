-- Native 68x89 editable conversion of the approved exact portrait.
-- Run from repository root using Aseprite --batch --script this-file.lua.
local THIS=debug.getinfo(1,'S').source:sub(2)
local function main()
local ROOT='art/character/native_68x89_v001/'
local STEM='portrait_68x89_v'..(app.params.revision or '001')
local PHASE=tonumber(app.params.phase or '0')
assert(not app.fs.isFile(ROOT..STEM..'.aseprite'),'Preserving previous output')
local source=assert(app.open('art/character/exact_reference_v001/portrait_exact_v001.aseprite'))
local src=Image(source.width,source.height,ColorMode.RGB)
src:clear(0); src:drawSprite(source,1)
local SW,SH=src.width,src.height
assert(SW==683 and SH==891)
source:close()
local W,H=68,89
local art=Image(W,H,ColorMode.RGB)
-- Nearest-neighbour sampling; alignment was visually checked to retain the
-- glasses and facial features. No averaging or smooth interpolation.
for y=0,H-1 do for x=0,W-1 do
 local sx=math.min(SW-1,math.floor((x+PHASE)*SW/W))
 local sy=math.min(SH-1,math.floor((y+PHASE)*SH/H))
 art:drawPixel(x,y,src:getPixel(sx,sy))
end end
-- Remove only exterior-connected neutral light background and confirmed hair
-- openings, including small compression variations in the gray reference.
local visited,queue={},{}; local head=1
local function isBackground(v)
 if app.pixelColor.rgbaA(v)==0 then return true end
 local r,g,b=app.pixelColor.rgbaR(v),app.pixelColor.rgbaG(v),app.pixelColor.rgbaB(v)
 return math.min(r,g,b)>=40 and math.max(r,g,b)-math.min(r,g,b)<=16
end
local function seed(x,y)
 if x<0 or x>=W or y<0 or y>=H then return end
 local k=y*W+x
 if not visited[k] and isBackground(art:getPixel(x,y)) then
  visited[k]=true; queue[#queue+1]=k
 end
end
for x=0,W-1 do seed(x,0); seed(x,H-1) end
for y=0,H-1 do seed(0,y); seed(W-1,y) end
seed(35,4); seed(36,5); seed(35,6)
seed(13,53); seed(14,53); seed(14,54); seed(54,47)
while head<=#queue do
 local k=queue[head]; head=head+1
 local x,y=k%W,math.floor(k/W)
 art:drawPixel(x,y,0)
 seed(x-1,y); seed(x+1,y); seed(x,y-1); seed(x,y+1)
end
local s=Sprite(W,H,ColorMode.RGB)
local l=s.layers[1]
l.name='Character - EDIT HERE'
l.isEditable=true; l.isVisible=true; l.opacity=255; l.blendMode=BlendMode.NORMAL
assert(l.isImage and not l.isReference and not l.isBackground and not l.isTilemap)
s:newCel(l,1,art,Point(0,0))
s.selection:deselect()
app.activeSprite=s; app.activeLayer=l; app.activeFrame=1
s.data='Native 68x89. ONE unlocked normal raster layer. All visible character pixels are directly paintable/erasable. No covering image or background layer.'
s:saveAs(ROOT..STEM..'.aseprite')
art:saveAs(ROOT..STEM..'.png')
local big=Image(W*8,H*8,ColorMode.RGB)
local light=Image(W*8,H*8,ColorMode.RGB)
local dark=Image(W*8,H*8,ColorMode.RGB)
local bgLight=app.pixelColor.rgba(230,230,230,255)
local bgDark=app.pixelColor.rgba(29,31,42,255)
for y=0,H*8-1 do for x=0,W*8-1 do
 local v=art:getPixel(math.floor(x/8),math.floor(y/8))
 big:drawPixel(x,y,v)
 local transparent=app.pixelColor.rgbaA(v)==0
 light:drawPixel(x,y,transparent and bgLight or v)
 dark:drawPixel(x,y,transparent and bgDark or v)
end end
big:saveAs(ROOT..STEM..'_8x.png')
light:saveAs(ROOT..STEM..'_light.png')
dark:saveAs(ROOT..STEM..'_dark.png')
local f=assert(io.open(THIS,'rb')); local code=f:read('*a'); f:close()
f=assert(io.open(ROOT..STEM..'.lua','wb')); f:write(code); f:close()
s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/native_68x89_v001/error.txt','w'))
 f:write(tostring(err)); f:close(); error(err)
end
