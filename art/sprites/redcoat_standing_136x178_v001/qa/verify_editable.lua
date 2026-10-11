-- Independent saved-file and real Aseprite tool-API verification for the standing sprite at 136x178.
-- Run from repository root. Writes only qa/verification.txt and one separate QA probe sprite.
local ROOT='art/sprites/redcoat_standing_136x178_v001/'
local QA=ROOT..'qa/'
local names={'redcoat-standing'}
local report={}
local function record(v) report[#report+1]=v end
local function bytes(path)
  local f=assert(io.open(path,'rb')); local v=f:read('*a'); f:close(); return v
end
local function render(s)
  local im=Image(136,178,ColorMode.RGB); im:clear(0); im:drawSprite(s,1); return im
end
local function checkLayerFlags(raw)
  local function u16(pos) return string.unpack('<I2',raw,pos) end
  local function u32(pos) return string.unpack('<I4',raw,pos) end
  local frame=129; local count=u16(frame+6)
  if count==65535 then count=u32(frame+12) end
  local cursor=frame+16; local layerChunks=0
  for _=1,count do
    local size,kind=u32(cursor),u16(cursor+4)
    if kind==0x2004 then
      layerChunks=layerChunks+1
      assert(u16(cursor+6)==3 and u16(cursor+8)==0,'Unexpected lock/reference/background layer flags')
    end
    cursor=cursor+size
  end
  assert(layerChunks==1,'Expected exactly one normal layer chunk')
end
local function verify(name,originalBytes)
  local stem=ROOT..name..'_136x178'
  local delivered=stem..'.aseprite'
  local s=assert(app.open(delivered))
  assert(s.width==136 and s.height==178 and s.colorMode==ColorMode.RGB and #s.frames==1)
  assert(#s.layers==1 and #s.cels==1)
  local l=s.layers[1]
  assert(l.name=='Sprite - EDIT HERE')
  assert(l.isVisible and l.isEditable and l.isImage and not l.isReference and
    not l.isBackground and not l.isTilemap and not l.isGroup)
  assert(l.opacity==255 and l.blendMode==BlendMode.NORMAL and l:cel(1).opacity==255)
  assert(s.selection.isEmpty,'Selection not empty on reopen')
  assert(app.activeSprite==s and app.activeLayer==l,'Sole character layer not active on reopen')
  checkLayerFlags(originalBytes)
  record('PASS '..name..': saved 136 x 178 RGB, one frame, one normal unlocked visible editable pixel layer; no group/reference/background/tilemap, empty selection, sole character layer active on reopen.')
  local png=Image{fromFile=stem..'.png'}
  local large=Image{fromFile=stem..'_4x.png'}
  assert(png.width==136 and png.height==178 and png.colorMode==ColorMode.RGB)
  assert(large.width==544 and large.height==712 and large.colorMode==ColorMode.RGB)
  local baseline=render(s); local used={}; local opaque,transparent=0,0
  for y=0,177 do for x=0,135 do
    local v=baseline:getPixel(x,y)
    assert(png:getPixel(x,y)==v,'Native PNG differs from saved rendering')
    local a=app.pixelColor.rgbaA(v); assert(a==0 or a==255,'Nonbinary alpha')
    if a==255 then opaque=opaque+1; used[v]=true else transparent=transparent+1 end
    for dy=0,3 do for dx=0,3 do
      assert(large:getPixel(x*4+dx,y*4+dy)==v,'4x preview is not exact nearest-neighbour')
    end end
  end end
  assert(opaque>0 and transparent>0)
  local count=0; for _ in pairs(used) do count=count+1 end
  record(string.format('PASS %s: native equals reopened rendering; %d opaque pixels, %d transparent pixels, %d actual opaque colors; binary alpha and exact 544 x 712 4x nearest-neighbour preview.',name,opaque,transparent,count))
  -- Test the active layer, not an explicitly routed layer. Both the paint and
  -- erase coordinates are verified to be opaque in the untouched character.
  s.selection:deselect()
  local magenta=Color{r=255,g=0,b=255,a=255}
  local magentaPixel=app.pixelColor.rgba(255,0,255,255)
  -- These interior positions and their right neighbours were checked against
  -- the final PNG: hair, face/tooth and coat pixels are all fully opaque.
  local probes={{part='hair',x=66,y=18},{part='face',x=68,y=34},{part='coat',x=50,y=62}}
  local expected={}
  for _,p in ipairs(probes) do
    local ex,ey=p.x+1,p.y
    assert(app.pixelColor.rgbaA(baseline:getPixel(p.x,p.y))==255,'Paint location not opaque: '..name..'/'..p.part)
    assert(app.pixelColor.rgbaA(baseline:getPixel(ex,ey))==255,'Erase location not opaque: '..name..'/'..p.part)
    assert(baseline:getPixel(p.x,p.y)~=magentaPixel,'Test paint color already present')
    app.useTool{tool='pencil',color=magenta,brush=Brush{size=1},opacity=255,points={Point(p.x,p.y)}}
    assert(render(s):getPixel(p.x,p.y)==magentaPixel,'Actual pencil did not repaint opaque '..p.part)
    app.useTool{tool='eraser',brush=Brush{size=1},opacity=255,points={Point(ex,ey)}}
    assert(app.pixelColor.rgbaA(render(s):getPixel(ex,ey))==0,'Actual eraser did not remove opaque '..p.part)
    expected[p.y*136+p.x]=magentaPixel; expected[ey*136+ex]=0
    record(string.format('PASS %s: real pencil changed opaque %s (%d,%d) to visible magenta and real eraser removed opaque (%d,%d); app.useTool had no layer argument.',name,p.part,p.x,p.y,ex,ey))
  end
  local edited=render(s); local changed=0
  for y=0,177 do for x=0,135 do
    if edited:getPixel(x,y)~=baseline:getPixel(x,y) then
      changed=changed+1; assert(expected[y*136+x]~=nil,'Unexpected collateral tool edit')
    end
  end end
  assert(changed==6,'Expected exactly six altered interior pixels')
  local probePath=QA..name..'_edit_probe.aseprite'
  s:saveCopyAs(probePath); s:close()
  assert(bytes(delivered)==originalBytes,'Final source changed during tool test')
  local reopened=assert(app.open(probePath)); local after=render(reopened)
  assert(#reopened.layers==1 and reopened.layers[1].isEditable)
  for y=0,177 do for x=0,135 do
    assert(after:getPixel(x,y)==edited:getPixel(x,y),'Saved/reopened probe differs from actual edits')
  end end
  reopened:close()
  assert(bytes(delivered)==originalBytes,'Final source changed during probe reopen')
  record('PASS '..name..': exactly six interior edits persisted pixel-for-pixel after saving/reopening the separate QA probe; delivered source bytes unchanged.')
end
local function main()
  local originals={}
  for _,name in ipairs(names) do originals[name]=bytes(ROOT..name..'_136x178.aseprite') end
  for _,name in ipairs(names) do verify(name,originals[name]); record('') end
  for _,name in ipairs(names) do
    assert(bytes(ROOT..name..'_136x178.aseprite')==originals[name],'Final immutability check failed: '..name)
  end
  record('PASS: the delivered .aseprite remains byte-identical to its starting state; only QA probes contain test marks.')
  record('Manual visual review: final native and 4x PNGs were actually opened and inspected after phase 0.25 was selected. Golden eyes, smile, coat folds and boots remain readable; no blocking silhouette or matte defect observed.')
  record('Editability evidence uses actual Aseprite pencil/eraser tool APIs and save/reopen tests. No GUI click test is claimed.')
end
local ok,err=xpcall(main,debug.traceback)
if not ok then record('FAIL: '..tostring(err)) end
local f=assert(io.open(QA..'verification.txt','w'))
f:write('Independent standing sprite 136x178 editability verification\nAseprite ',tostring(app.version),'\n\n',table.concat(report,'\n'),'\n'); f:close()
if not ok then error(err) end
