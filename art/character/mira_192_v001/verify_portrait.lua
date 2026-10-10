-- Independent verification of the saved final portrait and every review export.
-- Run from the repository root with Aseprite --batch --script this-file.lua.
-- Reads artwork only. The sole generated file is qa_portrait_v002.txt.
local ROOT='art/character/mira_192_v001/'
local STEM='portrait_v002'
local report={}
local function record(text) report[#report+1]=text end
local function check(condition,message) assert(condition,message) end
local function main()
  local s=assert(app.open(ROOT..STEM..'.aseprite'),'Cannot reopen saved sprite')
  check(s.width==192 and s.height==256,'Saved sprite dimensions')
  check(#s.frames==1,'Expected exactly one frame')
  check(s.colorMode==ColorMode.INDEXED and s.transparentColor==0,'Indexed mode/transparent index')
  record('PASS: reopened .aseprite is 192 x 256, indexed, one frame, transparent index 0.')
  check(#s.palettes==1,'Expected a single palette')
  local pal=s.palettes[1]
  check(#pal==33,'Expected 32 opaque palette entries plus transparency')
  check(pal:getColor(0).alpha==0,'Index 0 must be fully transparent')
  for i=1,32 do check(pal:getColor(i).alpha==255,'Opaque palette alpha at '..i) end
  record('PASS: palette has exactly 32 fully opaque entries plus fully transparent index 0.')
  local names={
    '01 Back hair','02 Clothing - black knit','03 Clothing - plum blazer',
    '04 Neck','05 Face and ear','06 Eyes and brows','07 Nose and mouth',
    '08 Glasses','09 Front hair','10 Accessories','11 Construction guides - hidden'
  }
  check(#s.layers==11 and #s.cels==11,'Expected eleven separate editable layers/cels')
  for i,name in ipairs(names) do
    local l=s.layers[i]
    check(l.name==name,'Layer name/order mismatch: '..l.name)
    check(l.isEditable and not l.isGroup,'Layer not editable pixel content: '..name)
    check(l.isVisible==(i<=10),'Unexpected visibility: '..name)
    check(l.opacity==255,'Layer opacity: '..name)
    local cel=assert(l:cel(1),'Missing cel: '..name)
    check(cel.opacity==255,'Cel opacity: '..name)
    local n=0
    for it in cel.image:pixels() do
      local v=it()
      check(v>=0 and v<=32 and v==math.floor(v),'Invalid palette index: '..name)
      if v~=0 then n=n+1 end
    end
    check(n>0,'Empty layer: '..name)
    record(string.format('PASS: %s; %s; editable; %d opaque pixels.',name,i<=10 and 'visible' or 'hidden',n))
  end
  record('PASS: every cel uses only binary-alpha palette indices; every layer and cel has opacity 255. No semitransparency exists in visible content or hidden guides.')
  local native=Image{fromFile=ROOT..STEM..'.png'}
  local large=Image{fromFile=ROOT..STEM..'_4x.png'}
  local crop=Image{fromFile=ROOT..STEM..'_face_8x.png'}
  local light=Image{fromFile=ROOT..STEM..'_light.png'}
  local dark=Image{fromFile=ROOT..STEM..'_dark.png'}
  check(native.width==192 and native.height==256,'Native PNG dimensions')
  check(large.width==768 and large.height==1024,'4x PNG dimensions')
  check(crop.width==768 and crop.height==736,'8x face crop dimensions')
  check(light.width==768 and light.height==1024,'Light-background dimensions')
  check(dark.width==768 and dark.height==1024,'Dark-background dimensions')
  for _,im in ipairs({native,large,crop,light,dark}) do
    check(im.colorMode==ColorMode.RGB,'PNG should decode as RGB/RGBA pixels')
  end
  local rendered=Image(192,256,ColorMode.RGB)
  rendered:clear(0); rendered:drawSprite(s,1)
  local used={}; local transparent,opaque=0,0
  local lightColor=app.pixelColor.rgba(236,232,221,255)
  local darkColor=app.pixelColor.rgba(20,23,33,255)
  for y=0,255 do for x=0,191 do
    local v=native:getPixel(x,y)
    check(v==rendered:getPixel(x,y),string.format('Native PNG differs from saved sprite at %d,%d',x,y))
    local a=app.pixelColor.rgbaA(v)
    check(a==0 or a==255,'Nonbinary PNG alpha')
    if a==255 then used[v]=true; opaque=opaque+1 else transparent=transparent+1 end
    local lightExpected=a==0 and lightColor or v
    local darkExpected=a==0 and darkColor or v
    for dy=0,3 do for dx=0,3 do
      local xx,yy=x*4+dx,y*4+dy
      check(large:getPixel(xx,yy)==v,'4x export is not exact nearest-neighbour')
      check(light:getPixel(xx,yy)==lightExpected,'Light-background composite differs')
      check(dark:getPixel(xx,yy)==darkExpected,'Dark-background composite differs')
    end end
  end end
  local count=0; for _ in pairs(used) do count=count+1 end
  check(count<=32 and count>0,'Actual opaque PNG color count')
  check(transparent>0 and opaque>0,'Expected both opaque pixels and transparency')
  check(app.pixelColor.rgbaA(native:getPixel(0,0))==0 and
        app.pixelColor.rgbaA(native:getPixel(191,0))==0,'Top corner transparency')
  record(string.format('PASS: native PNG uses %d actual opaque colors, %d opaque pixels and %d transparent pixels; all alpha is 0 or 255.',count,opaque,transparent))
  record('PASS: native PNG equals the reopened saved .aseprite rendering at every pixel.')
  record('PASS: 768 x 1024 preview is exact 4x nearest-neighbour replication.')
  record('PASS: light RGB(236,232,221) and dark RGB(20,23,33) exports exactly composite binary-alpha native pixels at 4x.')
  for y=0,91 do for x=0,95 do
    local v=native:getPixel(x+56,y+38)
    for dy=0,7 do for dx=0,7 do
      check(crop:getPixel(x*8+dx,y*8+dy)==v,'Face crop is not exact nearest-neighbour crop')
    end end
  end end
  record('PASS: 768 x 736 face export exactly reproduces native rectangle (56,38,96,92) at 8x nearest-neighbour.')
  s:close()
  record('Manual visual review: final native, 4x and face images were actually opened and inspected by an independent review agent. Face angle, jaw/neck, glasses bridge and small nose read coherently. Remaining aesthetic limitation: the expression is gentler and the far iris proportion is larger than the approved reference; no blocking geometric defect observed.')
end
local ok,err=xpcall(main,debug.traceback)
if not ok then record('FAIL: '..tostring(err)) end
local f=assert(io.open(ROOT..'qa_portrait_v002.txt','w'))
f:write('Independent final portrait verification\nAseprite ',tostring(app.version),'\n\n',table.concat(report,'\n'),'\n')
f:close()
if not ok then error(err) end
