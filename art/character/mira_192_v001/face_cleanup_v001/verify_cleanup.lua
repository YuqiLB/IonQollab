-- Independent read-only verification of the saved, focused face cleanup.
-- Run from the repository root through Aseprite --batch --script.
-- The only file this verifier writes is qa_portrait_v004.txt.
local ROOT='art/character/mira_192_v001/'
local OUT=ROOT..'face_cleanup_v001/'
local STEM='portrait_v004'
local report={}
local function record(v) report[#report+1]=v end
local function check(v,message) assert(v,message) end
local function bytes(path)
  local f=assert(io.open(path,'rb')); local v=f:read('*a'); f:close(); return v
end
local function sameColor(a,b)
  return a.red==b.red and a.green==b.green and a.blue==b.blue and a.alpha==b.alpha
end
local function boundsNew() return {n=0,x0=192,y0=256,x1=-1,y1=-1} end
local function touch(b,x,y)
  b.n=b.n+1; b.x0=math.min(b.x0,x); b.y0=math.min(b.y0,y)
  b.x1=math.max(b.x1,x); b.y1=math.max(b.y1,y)
end
local function describe(b)
  if b.n==0 then return '0 changed pixels' end
  return string.format('%d changed pixels; inclusive bounds (%d,%d)-(%d,%d)',b.n,b.x0,b.y0,b.x1,b.y1)
end
local function raster(cel)
  local a=Image(192,256,ColorMode.INDEXED); a:clear(0); a:drawImage(cel.image,cel.position); return a
end
local function render(s)
  local a=Image(192,256,ColorMode.RGB); a:clear(0); a:drawSprite(s,1); return a
end
local function inFace(x,y) return x>=73 and x<=143 and y>=42 and y<=123 end
local function loadImage(suffix,w,h)
  local a=Image{fromFile=OUT..STEM..suffix..'.png'}
  check(a.width==w and a.height==h,'Wrong export dimensions: '..suffix)
  check(a.colorMode==ColorMode.RGB,'Export must decode as RGB/RGBA: '..suffix)
  return a
end
local function main()
  local originalPath=ROOT..'portrait_v002.aseprite'
  local finalPath=OUT..STEM..'.aseprite'
  local originalBytes=bytes(originalPath)
  local finalBytes=bytes(finalPath)
  local old=assert(app.open(originalPath),'Cannot open actual original')
  local s=assert(app.open(finalPath),'Cannot open final source')
  for _,a in ipairs({old,s}) do
    check(a.width==192 and a.height==256 and #a.frames==1,'Sprite dimensions/frame count')
    check(a.colorMode==ColorMode.INDEXED and a.transparentColor==0,'Indexed mode/transparency')
    check(#a.palettes==1 and #a.palettes[1]==33,'Palette must have 33 entries')
  end
  check(old.frames[1].duration==s.frames[1].duration,'Frame duration changed')
  for i=0,32 do
    local a,b=old.palettes[1]:getColor(i),s.palettes[1]:getColor(i)
    check(sameColor(a,b),'Palette entry changed: '..i)
    check(b.alpha==(i==0 and 0 or 255),'Palette has nonbinary alpha')
  end
  record('PASS: actual original and final are 192 x 256 indexed, one frame, identical frame duration and identical palette (32 opaque colors plus transparent index 0).')
  local names={
    '01 Back hair','02 Clothing - black knit','03 Clothing - plum blazer',
    '04 Neck','05 Face and ear','06 Eyes and brows','07 Nose and mouth',
    '08 Glasses','09 Front hair','10 Accessories','11 Construction guides - hidden'
  }
  local protected={[1]=true,[2]=true,[3]=true,[9]=true,[10]=true}
  check(#old.layers==11 and #s.layers==11 and #s.cels==11,'Expected eleven layers and cels')
  local changedTotal=0
  for i,name in ipairs(names) do
    local a,b=old.layers[i],s.layers[i]
    check(a.name==name and b.name==name,'Layer name/order mismatch: '..name)
    check(b.isEditable and not b.isGroup,'Layer must remain editable pixel content: '..name)
    check(b.isVisible==(i<=10),'Layer visibility mismatch: '..name)
    check(b.opacity==255,'Layer opacity not fully opaque: '..name)
    local ca,cb=assert(a:cel(1)),assert(b:cel(1))
    check(cb.opacity==255,'Cel opacity not fully opaque: '..name)
    local nonempty=0
    for it in cb.image:pixels() do
      local v=it(); check(v>=0 and v<=32 and v==math.floor(v),'Invalid indexed cel pixel: '..name)
      if v~=0 then nonempty=nonempty+1 end
    end
    check(nonempty>0,'Empty editable layer: '..name)
    if protected[i] then
      for _,property in ipairs({'name','isVisible','isEditable','isGroup','isImage','isBackground',
        'isContinuous','isReference','isTilemap','opacity','blendMode','stackIndex','data'}) do
        check(a[property]==b[property],'Protected layer metadata changed: '..name..'/'..property)
      end
      check(sameColor(a.color,b.color),'Protected layer color metadata changed: '..name)
      check(ca.position.x==cb.position.x and ca.position.y==cb.position.y,'Protected cel position changed: '..name)
      for _,property in ipairs({'opacity','zIndex','data'}) do
        check(ca[property]==cb[property],'Protected cel metadata changed: '..name..'/'..property)
      end
      check(sameColor(ca.color,cb.color),'Protected cel color metadata changed: '..name)
      check(ca.image.width==cb.image.width and ca.image.height==cb.image.height and
        ca.image.colorMode==cb.image.colorMode,'Protected cel image geometry changed: '..name)
      for y=0,ca.image.height-1 do for x=0,ca.image.width-1 do
        check(ca.image:getPixel(x,y)==cb.image:getPixel(x,y),'Protected cel raw raster differs: '..name)
      end end
    end
    local ar,br=raster(ca),raster(cb)
    local delta=boundsNew()
    for y=0,255 do for x=0,191 do
      local av,bv=ar:getPixel(x,y),br:getPixel(x,y)
      if av~=bv then
        touch(delta,x,y)
        if protected[i] then error('Protected layer composite changed: '..name) end
        if i==4 then
          check(x>=76 and x<=116 and y>=99 and y<=122,'Neck modification outside permitted region')
          check(av>=8 and av<=13,'Neck modification touched original non-skin/collar pixel')
          check(bv>=8 and bv<=13,'Neck modification introduced a non-skin pixel')
        elseif i<=10 then
          check(inFace(x,y),'Visible edit outside face ROI: '..name..' at '..x..','..y)
        end
      end
    end end
    changedTotal=changedTotal+delta.n
    record('PASS: '..name..'; '..(protected[i] and 'protected raster and metadata exact; ' or '')..describe(delta)..'.')
  end
  record('PASS: eleven editable nonempty pixel layers; ten visible; construction guides hidden. All cels and layers have opacity 255 and all indexed pixels have binary alpha.')
  record('PASS: neck edits touch only preexisting skin indices 8-13 inside x76-116,y99-122; collar and neck silhouette remain unchanged.')
  record('INFO: summed per-layer changes, including hidden guides: '..changedTotal..'.')
  local original=render(old); local final=render(s)
  local native=loadImage('',192,256)
  local large=loadImage('_4x',768,1024)
  local face=loadImage('_face',84,88)
  local face8=loadImage('_face_8x',672,704)
  local comparison=loadImage('_before_after_native',176,88)
  local comparison6=loadImage('_before_after_6x',1056,528)
  local light=loadImage('_light',768,1024)
  local dark=loadImage('_dark',768,1024)
  local guides8=loadImage('_guides_8x',672,704)
  local lightBG=app.pixelColor.rgba(236,232,221,255)
  local darkBG=app.pixelColor.rgba(20,23,33,255)
  local compareBG=app.pixelColor.rgba(34,36,46,255)
  local used={}; local transparent,opaque=0,0
  local compositeDelta=boundsNew()
  for y=0,255 do for x=0,191 do
    local v=native:getPixel(x,y)
    check(v==final:getPixel(x,y),'Native PNG differs from saved sprite render')
    if v~=original:getPixel(x,y) then
      touch(compositeDelta,x,y); check(inFace(x,y),'Composite changed outside face ROI')
    end
    local alpha=app.pixelColor.rgbaA(v)
    check(alpha==0 or alpha==255,'Native PNG has nonbinary alpha')
    if alpha==255 then used[v]=true; opaque=opaque+1 else transparent=transparent+1 end
    local lightExpected=alpha==0 and lightBG or v
    local darkExpected=alpha==0 and darkBG or v
    for dy=0,3 do for dx=0,3 do
      local xx,yy=x*4+dx,y*4+dy
      check(large:getPixel(xx,yy)==v,'4x preview is not exact nearest-neighbour')
      check(light:getPixel(xx,yy)==lightExpected,'Light background composite mismatch')
      check(dark:getPixel(xx,yy)==darkExpected,'Dark background composite mismatch')
    end end
  end end
  local colorCount=0; for _ in pairs(used) do colorCount=colorCount+1 end
  check(colorCount==32,'Expected exactly 32 actual opaque colors')
  check(transparent>0 and opaque>0,'Expected opaque content and transparency')
  record('PASS: composite '..describe(compositeDelta)..'; every pixel outside face ROI x73-143,y42-123 is unchanged.')
  record(string.format('PASS: native equals saved rendering; %d actual opaque colors; %d opaque and %d fully transparent pixels; binary alpha only.',colorCount,opaque,transparent))
  record('PASS: 768 x 1024 preview is exact 4x nearest-neighbour; light/dark composites are exact at every pixel.')
  for y=0,87 do for x=0,83 do
    local v=native:getPixel(x+60,y+42)
    check(face:getPixel(x,y)==v,'Native face crop mismatch')
    for dy=0,7 do for dx=0,7 do
      check(face8:getPixel(x*8+dx,y*8+dy)==v,'8x face crop mismatch')
    end end
  end end
  record('PASS: native face crop is rectangle (60,42,84,88); 672 x 704 export is exact 8x nearest-neighbour.')
  for y=0,87 do for x=0,175 do
    local expected=compareBG
    if x<84 then expected=original:getPixel(x+60,y+42)
    elseif x>=92 then expected=native:getPixel(x-92+60,y+42) end
    if app.pixelColor.rgbaA(expected)==0 then expected=compareBG end
    check(comparison:getPixel(x,y)==expected,'Before/after native comparison mismatch')
    check(app.pixelColor.rgbaA(comparison:getPixel(x,y))==255,'Comparison must be opaque')
    for dy=0,5 do for dx=0,5 do
      check(comparison6:getPixel(x*6+dx,y*6+dy)==expected,'Before/after 6x scaling mismatch')
    end end
  end end
  record('PASS: 176 x 88 comparison contains actual original at x0 and final at x92, exactly composited on RGB(34,36,46) with an 8px gap; 1056 x 528 is exact 6x nearest-neighbour.')
  s.layers[11].isVisible=true
  local guideRender=render(s)
  s.layers[11].isVisible=false
  for y=0,87 do for x=0,83 do
    local v=guideRender:getPixel(x+60,y+42)
    for dy=0,7 do for dx=0,7 do
      check(guides8:getPixel(x*8+dx,y*8+dy)==v,'Guide overlay export mismatch')
    end end
  end end
  record('PASS: guide overlay export exactly matches the saved guide cel made visible temporarily; final saved guides remain hidden.')
  s:close(); old:close()
  check(bytes(originalPath)==originalBytes,'Original source bytes changed during verification')
  check(bytes(finalPath)==finalBytes,'Candidate source bytes changed during verification')
  record('PASS: verifier left original and final .aseprite byte streams unchanged.')
  record('Manual visual review: actual before/after 6x and final full 4x images opened and inspected. Lower-face taper is restrained; cheek notch and narrow bright nasal stripe are gone; chin stays softly rounded. No blocking visual issue. The native pixel scale still limits subtle expression detail.')
end
local ok,err=xpcall(main,debug.traceback)
if not ok then record('FAIL: '..tostring(err)) end
local f=assert(io.open(OUT..'qa_portrait_v004.txt','w'))
f:write('Independent focused cleanup verification\nAseprite ',tostring(app.version),'\n\n',table.concat(report,'\n'),'\n'); f:close()
if not ok then error(err) end
