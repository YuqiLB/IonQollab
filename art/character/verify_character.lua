-- Reload the saved layered source and verify its actual rendered pixels.
local s=app.open('art/character/character-v002.aseprite')
assert(s.width==128 and s.height==192)
assert(s.colorMode==ColorMode.INDEXED)
assert(#s.frames==1 and #s.layers==6 and #s.palettes[1]==25)
local expected={'01 Back hair','02 Body and clothing','03 Face','04 Eyes','05 Front hair','06 Accessories'}
for i,name in ipairs(expected) do assert(s.layers[i].name==name); assert(s.layers[i]:cel(1)) end
local rendered=Image(128,192,ColorMode.RGB)
rendered:clear(0)
rendered:drawSprite(s,1)
local native=Image{fromFile='assets/character/neutral-v002.png'}
local preview=Image{fromFile='art/character/preview-4x-v002.png'}
assert(native.width==128 and native.height==192)
assert(preview.width==512 and preview.height==768)
local colors={}
for y=0,191 do for x=0,127 do
  local v=native:getPixel(x,y)
  assert(v==rendered:getPixel(x,y),'Layered source/export mismatch')
  local a=app.pixelColor.rgbaA(v)
  assert(a==0 or a==255,'Partial alpha')
  if a==255 then colors[v]=true end
  for dy=0,3 do for dx=0,3 do
    assert(preview:getPixel(x*4+dx,y*4+dy)==v,'Preview is not exact nearest-neighbour')
  end end
end end
local n=0; for _ in pairs(colors) do n=n+1 end
assert(n<=24)
local f=assert(io.open('art/character/qa-v002.txt','w'))
f:write('PASS: source reloaded; six named editable layers; one neutral frame; 128x192 indexed canvas.\n',
  'PASS: native PNG equals Aseprite rendering pixel-for-pixel.\n',
  'PASS: ',n,' opaque colors; alpha values only 0 and 255.\n',
  'PASS: preview is exact 4x pixel replication, 512x768.\n',
  'Visual inspection: native and 4x exports inspected for v001 and v002.\n',
  'Refinements: round frames, raised near brow, cheek shadow, hair tips, sleeve fold.\n')
f:close()
s:close()
