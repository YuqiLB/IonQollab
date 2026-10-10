-- Validate the SAVED sprite and both exports, not just the drawing buffers.
local function main()
local stem='dark_v2'
local s=assert(app.open('art/character/character_'..stem..'.aseprite'))
assert(s.width==128 and s.height==192 and #s.frames==1)
assert(s.colorMode==ColorMode.INDEXED and s.transparentColor==0)
assert(#s.palettes[1]==25 and s.palettes[1]:getColor(0).alpha==0)
for i=1,24 do assert(s.palettes[1]:getColor(i).alpha==255) end
local names={'01 Back hair','02 Body and top','03 Blazer','04 Face and ears',
 '05 Eyes and eyebrows','06 Nose and mouth','07 Glasses','08 Front hair','09 Accessories'}
assert(#s.layers==9 and #s.cels==9)
for i,name in ipairs(names) do
 local l=s.layers[i]
 assert(l.name==name,'Wrong layer stacking: '..l.name)
 assert(l.isVisible and l.isEditable and l.opacity==255)
 local cel=assert(l:cel(1)); assert(cel.opacity==255)
 local count=0
 for it in cel.image:pixels() do
  local v=it(); assert(v>=0 and v<=24); if v~=0 then count=count+1 end
 end
 assert(count>0,'Empty layer: '..name)
end
local actual=Image(128,192,ColorMode.RGB)
actual:clear(0); actual:drawSprite(s,1)
local native=Image{fromFile='assets/character/neutral_'..stem..'.png'}
local large=Image{fromFile='art/character/preview_'..stem..'_4x.png'}
assert(native.width==128 and native.height==192)
assert(large.width==512 and large.height==768)
local used={}; local transparent=0
for y=0,191 do for x=0,127 do
 local v=native:getPixel(x,y)
 assert(v==actual:getPixel(x,y),'Saved source render differs from PNG')
 local a=app.pixelColor.rgbaA(v)
 assert(a==0 or a==255,'Semitransparent edge pixel')
 if a==255 then used[v]=true else transparent=transparent+1 end
 for dy=0,3 do for dx=0,3 do
  assert(large:getPixel(x*4+dx,y*4+dy)==v,'Invalid nearest-neighbour export')
 end end
end end
local count=0; for _ in pairs(used) do count=count+1 end
assert(count<=24 and transparent>0)
assert(native:getPixel(0,0)==0 and native:getPixel(127,0)==0)
local f=assert(io.open('art/character/qa_'..stem..'.txt','w'))
f:write('PASS: saved source is 128 x 192, indexed, one frame.\n',
 'PASS: nine visible, editable, nonempty pixel layers in the requested stacking order.\n',
 'PASS: palette = 24 opaque entries + fully transparent index 0.\n',
 'PASS: PNG uses ',count,' opaque colors; ',transparent,' transparent pixels; binary alpha only.\n',
 'PASS: native PNG equals the reopened Aseprite rendering pixel-for-pixel.\n',
 'PASS: 512 x 768 preview is exact 4x nearest-neighbour replication.\n',
 'Visual review: native and 4x inspected for both v1 and v2 against the supplied reference.\n',
 'v2: shorter nose cluster on the projected centerline, subtler smirk, restrained top highlights.\n')
f:close(); s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
 local f=assert(io.open('art/character/qa_dark_error.txt','w')); f:write(tostring(err)); f:close()
 error(err)
end
