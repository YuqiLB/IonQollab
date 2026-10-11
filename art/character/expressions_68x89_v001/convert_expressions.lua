-- Run from repository root with Aseprite --batch --script this-file.lua.
-- Uses the prior native 68x89 workflow: direct nearest-neighbour sampling,
-- transparent matte removal, and ONE unlocked editable raster layer.
local ROOT='art/character/expressions_68x89_v001/'
local W,H=68,89
local pc=app.pixelColor
local specs={
  {name='serious',file='mira-serious.png',width=302,height=441,cropLeft=2,phase=0.75,
    holes={{52,28},{50,42},{12,49}}},
  {name='surprised',file='mira-surprised.png',width=305,height=450,cropLeft=0,phase=0.25,
    holes={{53,29},{50,42},{14,48}}},
  {name='blushing',file='mira-blushing.png',width=297,height=456,cropLeft=0,phase=0,
    holes={{33,5},{32,6},{52,30},{50,42},{9,70}}},
  {name='happy',file='mira-happy.png',width=302,height=447,cropLeft=0,phase=0.25,
    holes={{53,30},{51,43},{14,49}}},
}
local log={}
local function background(v)
  if pc.rgbaA(v)==0 then return true end
  local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v)
  return math.min(r,g,b)>=40 and math.max(r,g,b)-math.min(r,g,b)<=16
end
local function matte(im,seeds)
  local visited,queue={},{}; local head=1
  local function seed(x,y)
    if x<0 or x>=W or y<0 or y>=H then return end
    local k=y*W+x
    if not visited[k] and background(im:getPixel(x,y)) then
      visited[k]=true; queue[#queue+1]=k
    end
  end
  for x=0,W-1 do seed(x,0); seed(x,H-1) end
  for y=0,H-1 do seed(0,y); seed(W-1,y) end
  for _,p in ipairs(seeds or {}) do seed(p[1],p[2]) end
  while head<=#queue do
    local k=queue[head]; head=head+1
    local x,y=k%W,math.floor(k/W)
    im:drawPixel(x,y,0)
    seed(x-1,y); seed(x+1,y); seed(x,y-1); seed(x,y+1)
  end
end
local function sample(spec,phase)
  local src=Image{fromFile=ROOT..'sources/'..spec.file}
  assert(src.width==spec.width and src.height==spec.height and src.colorMode==ColorMode.RGB)
  local sw,sh=src.width-spec.cropLeft,src.height
  local scale=math.min(W/sw,H/sh)
  local dw,dh=math.floor(sw*scale+0.5),math.floor(sh*scale+0.5)
  local ox,oy=math.floor((W-dw)/2),H-dh
  local art=Image(W,H,ColorMode.RGB); art:clear(0)
  for y=0,dh-1 do for x=0,dw-1 do
    local sx=spec.cropLeft+math.min(sw-1,math.floor((x+phase)*sw/dw))
    local sy=math.min(sh-1,math.floor((y+phase)*sh/dh))
    art:drawPixel(ox+x,oy+y,src:getPixel(sx,sy))
  end end
  -- Seed enclosed, visually confirmed gaps in the crown and loose hair only.
  -- Coordinates belong to the selected sampling phase, not the other trials.
  matte(art,phase==spec.phase and spec.holes or nil)
  return art,string.format('%s: source %dx%d, crop-left=%d, fit=%dx%d at (%d,%d), phase=%g',
    spec.name,src.width,src.height,spec.cropLeft,dw,dh,ox,oy,phase)
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
  if app.params.review=='1' then
    local phases={0,0.25,0.5,0.75}
    local sheet=Image(W*4,H*4,ColorMode.RGB); sheet:clear(0)
    for row,phase in ipairs(phases) do for col,spec in ipairs(specs) do
      local art=sample(spec,phase)
      art:saveAs(ROOT..'review/'..spec.name..'_phase'..tostring(phase)..'.png')
      sheet:drawImage(art,Point((col-1)*W,(row-1)*H))
    end end
    enlarge(sheet,4,pc.rgba(230,230,230,255)):saveAs(ROOT..'review/sampling_4x.png')
    enlarge(sheet,4,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/sampling_dark_4x.png')
    return
  end
  local contact=Image(W*4,H,ColorMode.RGB); contact:clear(0)
  for i,spec in ipairs(specs) do
    local stem=ROOT..'mira-'..spec.name..'_68x89'
    assert(not app.fs.isFile(stem..'.aseprite'),'Preserve existing final files')
    local art,info=sample(spec,spec.phase); log[#log+1]=info
    local s=Sprite(W,H,ColorMode.RGB)
    local l=s.layers[1]; l.name='Character - EDIT HERE'
    l.isEditable=true; l.isVisible=true; l.opacity=255; l.blendMode=BlendMode.NORMAL
    assert(l.isImage and not l.isReference and not l.isBackground and not l.isTilemap)
    s:newCel(l,1,art,Point(0,0)); s.selection:deselect()
    app.activeSprite=s; app.activeLayer=l; app.activeFrame=1
    s.data='Native 68x89 '..spec.name..'. One unlocked normal raster layer; all character pixels directly paintable/erasable. '..info
    s:saveAs(stem..'.aseprite'); art:saveAs(stem..'.png')
    enlarge(art,8):saveAs(stem..'_8x.png')
    enlarge(art,8,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/'..spec.name..'_dark_8x.png')
    contact:drawImage(art,Point((i-1)*W,0))
    s:close()
  end
  contact:saveAs(ROOT..'expressions_native.png')
  enlarge(contact,4,pc.rgba(230,230,230,255)):saveAs(ROOT..'expressions_preview_4x.png')
  enlarge(contact,4,pc.rgba(29,31,42,255)):saveAs(ROOT..'review/expressions_dark_4x.png')
  local f=assert(io.open(ROOT..'conversion.txt','w')); f:write(table.concat(log,'\n'),'\n'); f:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then
  local f=assert(io.open(ROOT..'error.txt','w')); f:write(tostring(err)); f:close(); error(err)
end
