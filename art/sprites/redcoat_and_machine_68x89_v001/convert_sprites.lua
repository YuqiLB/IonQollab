-- Same editable 68x89 workflow as the earlier portrait/expression assets.
-- Run from the repository root using Aseprite --batch --script this-file.lua.
local ROOT='art/sprites/redcoat_and_machine_68x89_v001/'
local W,H=68,89
local pc=app.pixelColor
local ALPHA_CUTOFF=128
local specs={
  {name='redcoat-standing',width=1097,height=1434,phase=0.75},
  {name='redcoat-fallen',width=1536,height=1024,phase=0.5},
  {name='machine',width=1097,height=1434,phase=0.5},
}
local log={}
local function prepare(spec)
  local src=Image{fromFile=ROOT..'sources/'..spec.name..'.png'}
  assert(src.width==spec.width and src.height==spec.height and src.colorMode==ColorMode.RGB)
  local x0,y0,x1,y1=src.width,src.height,-1,-1
  local transparent,partial,opaque=0,0,0
  for y=0,src.height-1 do for x=0,src.width-1 do
    local a=pc.rgbaA(src:getPixel(x,y))
    if a==0 then transparent=transparent+1 elseif a==255 then opaque=opaque+1 else partial=partial+1 end
    if a>=ALPHA_CUTOFF then
      x0=math.min(x0,x); y0=math.min(y0,y); x1=math.max(x1,x); y1=math.max(y1,y)
    end
  end end
  assert(transparent>0,'Expected a supplied transparent source, not an opaque black background')
  assert(x1>=x0 and y1>=y0)
  spec.src=src; spec.crop={x=x0,y=y0,width=x1-x0+1,height=y1-y0+1}
  log[#log+1]=string.format('%s source: %dx%d; alpha zero=%d partial=%d opaque=%d; threshold=%d; content crop=(%d,%d,%d,%d)',
    spec.name,src.width,src.height,transparent,partial,opaque,ALPHA_CUTOFF,x0,y0,x1-x0+1,y1-y0+1)
end
local function sample(spec,phase)
  local c=spec.crop
  local scale=math.min(W/c.width,H/c.height)
  local dw,dh=math.floor(c.width*scale+0.5),math.floor(c.height*scale+0.5)
  local ox,oy=math.floor((W-dw)/2),H-dh
  local art=Image(W,H,ColorMode.RGB); art:clear(0)
  for y=0,dh-1 do for x=0,dw-1 do
    local sx=c.x+math.min(c.width-1,math.floor((x+phase)*c.width/dw))
    local sy=c.y+math.min(c.height-1,math.floor((y+phase)*c.height/dh))
    local v=spec.src:getPixel(sx,sy)
    if pc.rgbaA(v)>=ALPHA_CUTOFF then
      -- Retain sampled RGB; snap alpha to binary transparency for direct pixels.
      art:drawPixel(ox+x,oy+y,pc.rgba(pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v),255))
    end
  end end
  return art,string.format('%s output: canvas=68x89; fitted=%dx%d; offset=(%d,%d); sampling phase=%g',
    spec.name,dw,dh,ox,oy,phase)
end
local function enlarge(im,n,bg)
  local out=Image(im.width*n,im.height*n,ColorMode.RGB)
  for y=0,out.height-1 do for x=0,out.width-1 do
    local v=im:getPixel(math.floor(x/n),math.floor(y/n))
    if bg and pc.rgbaA(v)==0 then v=bg end
    out:drawPixel(x,y,v)
  end end
  return out
end
local function main()
  for _,spec in ipairs(specs) do prepare(spec) end
  if app.params.review=='1' then
    local phases={0,0.25,0.5,0.75}
    local sheet=Image(W*#specs,H*#phases,ColorMode.RGB); sheet:clear(0)
    for row,phase in ipairs(phases) do for col,spec in ipairs(specs) do
      local art=sample(spec,phase)
      art:saveAs(ROOT..'review/'..spec.name..'_phase'..tostring(phase)..'.png')
      sheet:drawImage(art,Point((col-1)*W,(row-1)*H))
    end end
    enlarge(sheet,4,pc.rgba(230,230,230,255)):saveAs(ROOT..'review/sampling_light_4x.png')
    enlarge(sheet,4,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/sampling_dark_4x.png')
    local f=assert(io.open(ROOT..'review/source_analysis.txt','w')); f:write(table.concat(log,'\n'),'\n'); f:close()
    return
  end
  local contact=Image(W*#specs,H,ColorMode.RGB); contact:clear(0)
  for i,spec in ipairs(specs) do
    local stem=ROOT..spec.name..'_68x89'
    assert(not app.fs.isFile(stem..'.aseprite'),'Preserve existing final files')
    local art,info=sample(spec,spec.phase); log[#log+1]=info
    local s=Sprite(W,H,ColorMode.RGB)
    local l=s.layers[1]; l.name='Sprite - EDIT HERE'
    l.isEditable=true; l.isVisible=true; l.opacity=255; l.blendMode=BlendMode.NORMAL
    assert(l.isImage and not l.isReference and not l.isBackground and not l.isTilemap)
    s:newCel(l,1,art,Point(0,0)); s.selection:deselect()
    app.activeSprite=s; app.activeLayer=l; app.activeFrame=1
    s.data='Native 68x89. One unlocked normal raster layer; all visible sprite pixels directly paintable/erasable. '..info
    s:saveAs(stem..'.aseprite'); art:saveAs(stem..'.png')
    enlarge(art,8):saveAs(stem..'_8x.png')
    enlarge(art,8,pc.rgba(230,230,230,255)):saveAs(ROOT..'review/'..spec.name..'_light_8x.png')
    enlarge(art,8,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/'..spec.name..'_dark_8x.png')
    contact:drawImage(art,Point((i-1)*W,0)); s:close()
  end
  contact:saveAs(ROOT..'sprites_native.png')
  enlarge(contact,4,pc.rgba(230,230,230,255)):saveAs(ROOT..'sprites_preview_4x.png')
  enlarge(contact,4,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/sprites_dark_4x.png')
  local f=assert(io.open(ROOT..'conversion.txt','w')); f:write(table.concat(log,'\n'),'\n'); f:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
  local f=assert(io.open(ROOT..'error.txt','w')); f:write(tostring(err)); f:close(); error(err)
end
