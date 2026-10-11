-- Verify the final saved sprite, then exercise Aseprite's real pencil/eraser
-- tool API on opaque character pixels. The delivered file is never saved.
local ROOT='art/character/native_68x89_v001/'
local STEM='portrait_68x89_v003'
local PROBE=ROOT..'qa_edit_probe.aseprite'
local report={}
local function record(v) report[#report+1]=v end
local function bytes(path)
  local f=assert(io.open(path,'rb')); local v=f:read('*a'); f:close(); return v
end
local function render(s)
  local im=Image(68,89,ColorMode.RGB); im:clear(0); im:drawSprite(s,1); return im
end
local function main()
  local delivered=ROOT..STEM..'.aseprite'
  local originalBytes=bytes(delivered)
  local s=assert(app.open(delivered))
  assert(s.width==68 and s.height==89 and s.colorMode==ColorMode.RGB and #s.frames==1)
  assert(#s.layers==1 and #s.cels==1)
  local l=s.layers[1]
  assert(l.name=='Character - EDIT HERE')
  assert(l.isVisible and l.isEditable and l.isImage and not l.isReference and
    not l.isBackground and not l.isTilemap and not l.isGroup)
  assert(l.opacity==255 and l.blendMode==BlendMode.NORMAL and l:cel(1).opacity==255)
  assert(s.selection.isEmpty,'Selection not empty on reopen')
  assert(app.activeSprite==s and app.activeLayer==l,'Sole character layer is not active on reopen')
  local function u16(pos) return string.unpack('<I2',originalBytes,pos) end
  local function u32(pos) return string.unpack('<I4',originalBytes,pos) end
  local frame=129; local count=u16(frame+6)
  if count==65535 then count=u32(frame+12) end
  local cursor=frame+16; local layerChunks=0
  for _=1,count do
    local size,kind=u32(cursor),u16(cursor+4)
    if kind==0x2004 then
      layerChunks=layerChunks+1
      assert(u16(cursor+6)==3 and u16(cursor+8)==0,'Layer flags contain a lock/reference/background flag')
    end
    cursor=cursor+size
  end
  assert(layerChunks==1)
  record('PASS: saved 68 x 89 RGB sprite, one frame, one visible editable normal pixel layer named Character - EDIT HERE; layer flags exactly Visible+Editable, no movement/reference/background lock.')
  record('PASS: selection is empty and the sole character layer is active immediately after reopening.')
  local png=Image{fromFile=ROOT..STEM..'.png'}
  local large=Image{fromFile=ROOT..STEM..'_8x.png'}
  assert(png.width==68 and png.height==89 and png.colorMode==ColorMode.RGB)
  assert(large.width==544 and large.height==712 and large.colorMode==ColorMode.RGB)
  local baseline=render(s); local colors={}; local opaque,transparent=0,0
  for y=0,88 do for x=0,67 do
    local v=baseline:getPixel(x,y)
    assert(png:getPixel(x,y)==v,'Native PNG differs from saved rendering')
    local a=app.pixelColor.rgbaA(v); assert(a==0 or a==255,'Nonbinary alpha')
    if a==255 then opaque=opaque+1; colors[v]=true else transparent=transparent+1 end
    for dy=0,7 do for dx=0,7 do
      assert(large:getPixel(x*8+dx,y*8+dy)==v,'8x is not exact nearest-neighbour')
    end end
  end end
  assert(opaque>0 and transparent>0)
  local colorCount=0; for _ in pairs(colors) do colorCount=colorCount+1 end
  record(string.format('PASS: native PNG equals saved rendering; %d opaque pixels, %d transparent pixels, %d actual opaque colors, binary alpha; 544 x 712 preview is exact 8x nearest-neighbour.',opaque,transparent,colorCount))
  -- Use active-layer routing. Deliberately DO NOT pass a layer argument to useTool.
  s.selection:deselect()
  local magenta=Color{r=255,g=0,b=255,a=255}
  local magentaPixel=app.pixelColor.rgba(255,0,255,255)
  local probes={
    {name='hair',x=30,y=18},
    {name='face',x=38,y=40},
    {name='clothing',x=36,y=65}
  }
  local expected={}
  for _,p in ipairs(probes) do
    assert(app.pixelColor.rgbaA(baseline:getPixel(p.x,p.y))==255,'Paint point is not opaque '..p.name)
    assert(baseline:getPixel(p.x,p.y)~=magentaPixel,'Paint color already present')
    local ex,ey=p.x+1,p.y
    assert(app.pixelColor.rgbaA(baseline:getPixel(ex,ey))==255,'Eraser point is not opaque '..p.name)
    app.useTool{tool='pencil',color=magenta,brush=Brush{size=1},opacity=255,points={Point(p.x,p.y)}}
    assert(render(s):getPixel(p.x,p.y)==magentaPixel,'Pencil did not visibly repaint opaque '..p.name)
    app.useTool{tool='eraser',brush=Brush{size=1},opacity=255,points={Point(ex,ey)}}
    assert(app.pixelColor.rgbaA(render(s):getPixel(ex,ey))==0,'Eraser did not remove opaque '..p.name)
    expected[p.y*68+p.x]=magentaPixel; expected[ey*68+ex]=0
    record(string.format('PASS: actual pencil repainted opaque %s pixel (%d,%d) magenta, and actual eraser removed adjacent opaque pixel (%d,%d), using active-layer routing.',p.name,p.x,p.y,ex,ey))
  end
  local edited=render(s); local changed=0
  for y=0,88 do for x=0,67 do
    local actual=edited:getPixel(x,y); local old=baseline:getPixel(x,y)
    if actual~=old then
      changed=changed+1; assert(expected[y*68+x]~=nil,'Tool altered an unintended pixel')
    end
  end end
  assert(changed==6,'Expected exactly six changed interior pixels')
  s:saveCopyAs(PROBE); s:close()
  assert(bytes(delivered)==originalBytes,'Delivered sprite was changed by probe')
  local reopened=assert(app.open(PROBE)); local after=render(reopened)
  assert(#reopened.layers==1 and reopened.layers[1].isEditable)
  for y=0,88 do for x=0,67 do
    assert(after:getPixel(x,y)==edited:getPixel(x,y),'Probe edits did not persist exactly after save/reopen')
  end end
  reopened:close()
  assert(bytes(delivered)==originalBytes,'Delivered sprite bytes changed')
  record('PASS: exactly six interior edits (three paints and three erasures) persisted pixel-for-pixel after saving and reopening qa_edit_probe.aseprite.')
  record('PASS: delivered .aseprite bytes remain unchanged. Only the separate QA probe contains test marks.')
  record('Manual review: final native and 8x images were actually opened and inspected. Character remains readable at 68 x 89. Editability was tested with real Aseprite tool APIs; no GUI click test is claimed.')
end
local ok,err=xpcall(main,debug.traceback)
if not ok then record('FAIL: '..tostring(err)) end
local f=assert(io.open(ROOT..'qa_editable.txt','w')); f:write(table.concat(report,'\n'),'\n'); f:close()
if not ok then error(err) end
