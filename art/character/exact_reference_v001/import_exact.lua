-- Exact import of the bitmap supplied with the user's 1:1 request.
-- No drawing, resizing, rotation, filtering, quantization or palette reduction.
local THIS=debug.getinfo(1,'S').source:sub(2)
local function main()
local ROOT='art/character/exact_reference_v001/'
local STEM='portrait_exact_v001'
assert(not app.fs.isFile(ROOT..STEM..'.aseprite'),'Preserving existing output')
local src=Image{fromFile=ROOT..'clipboard_reference.png'}
local W,H=src.width,src.height
assert(W==683 and H==891 and src.colorMode==ColorMode.RGB)
local bg=src:getPixel(0,0)
assert(app.pixelColor.rgbaA(bg)==255)
local s=Sprite(W,H,ColorMode.RGB)
local background=s.layers[1]; background.name='01 Reference background'
local bgImage=Image(W,H,ColorMode.RGB); bgImage:clear(bg)
s:newCel(background,1,bgImage,Point(0,0))
local character=s:newLayer(); character.name='02 Character - original pixels'
local art=Image(src)
-- Only flood-fill flat background connected to the exterior or the three
-- visually confirmed openings between hair strands. This preserves matching
-- gray colors inside the eyes and silver jewellery. Edge pixels remain exact.
local visited={}; local queue={}; local head=1; local removed=0
local function seed(x,y)
 if x<0 or x>=W or y<0 or y>=H then return end
 local k=y*W+x
 if not visited[k] and src:getPixel(x,y)==bg then
  visited[k]=true; queue[#queue+1]=k
 end
end
for x=0,W-1 do seed(x,0); seed(x,H-1) end
for y=0,H-1 do seed(0,y); seed(W-1,y) end
-- Crown curl, lower-left hair opening, and right shoulder hair opening.
seed(360,49); seed(139,540); seed(545,475)
while head<=#queue do
 local k=queue[head]; head=head+1
 local x,y=k%W,math.floor(k/W)
 art:drawPixel(x,y,0); removed=removed+1
 seed(x-1,y); seed(x+1,y); seed(x,y-1); seed(x,y+1)
end
s:newCel(character,1,art,Point(0,0))
s.data='Exact 683x891 supplied bitmap. RGB pixels retained without resampling or palette changes. Visible composite is pixel-identical to clipboard_reference.png.'
s:saveAs(ROOT..STEM..'.aseprite')
local result=Image(W,H,ColorMode.RGB); result:clear(0); result:drawSprite(s,1)
for y=0,H-1 do for x=0,W-1 do
 assert(result:getPixel(x,y)==src:getPixel(x,y),'Pixel mismatch in exact import')
end end
result:saveAs(ROOT..STEM..'.png')
-- Optional transparent working export. All retained foreground RGBA pixels
-- are unchanged; no antialiasing/color decontamination is applied to its edge.
art:saveAs(ROOT..STEM..'_transparent.png')
local f=assert(io.open(THIS,'rb')); local code=f:read('*a'); f:close()
f=assert(io.open(ROOT..STEM..'.lua','wb')); f:write(code); f:close()
f=assert(io.open(ROOT..'import_report.txt','w'))
f:write('PASS: source and rendered result are exactly ',W,' x ',H,'.\n',
 'PASS: all ',W*H,' RGBA pixels match the source bitmap.\n',
 'PASS: no resampling, quantization, palette reduction, or redrawing.\n',
 'Two editable layers: original-pixel character and reference background.\n',
 'Background pixels isolated: ',removed,'.\n')
f:close(); s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/exact_reference_v001/error.txt','w'))
 f:write(tostring(err)); f:close(); error(err)
end
