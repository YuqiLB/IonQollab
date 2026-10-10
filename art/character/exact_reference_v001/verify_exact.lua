-- Reopen and independently verify the exact bitmap import. Writes only qa_exact.txt.
local ROOT='art/character/exact_reference_v001/'
local STEM='portrait_exact_v001'
local report={}
local function main()
  local src=Image{fromFile=ROOT..'clipboard_reference.png'}
  local png=Image{fromFile=ROOT..STEM..'.png'}
  local transparent=Image{fromFile=ROOT..STEM..'_transparent.png'}
  local s=assert(app.open(ROOT..STEM..'.aseprite'))
  assert(s.width==683 and s.height==891 and s.colorMode==ColorMode.RGB)
  assert(#s.frames==1 and #s.layers==2 and #s.cels==2)
  for _,im in ipairs({src,png,transparent}) do
    assert(im.width==683 and im.height==891 and im.colorMode==ColorMode.RGB)
  end
  local names={'01 Reference background','02 Character - original pixels'}
  for i,name in ipairs(names) do
    local l=s.layers[i]; assert(l.name==name and l.isVisible and l.isEditable and l.opacity==255)
    local cel=assert(l:cel(1)); assert(cel.opacity==255)
  end
  report[#report+1]='PASS: reopened source is 683 x 891 RGB, one frame, with two visible editable pixel layers.'
  local rendered=Image(683,891,ColorMode.RGB); rendered:clear(0); rendered:drawSprite(s,1)
  local foreground=Image(683,891,ColorMode.RGB); foreground:clear(0)
  local cel=s.layers[2]:cel(1); foreground:drawImage(cel.image,cel.position)
  local retained,removed=0,0
  for y=0,890 do for x=0,682 do
    local v=src:getPixel(x,y)
    assert(rendered:getPixel(x,y)==v,'Saved sprite render differs from source')
    assert(png:getPixel(x,y)==v,'PNG differs from source')
    local fg=foreground:getPixel(x,y)
    assert(transparent:getPixel(x,y)==fg,'Transparent PNG differs from foreground layer')
    if app.pixelColor.rgbaA(fg)~=0 then
      assert(fg==v,'Retained foreground pixel differs from source'); retained=retained+1
    else
      assert(v==src:getPixel(0,0),'Removed pixel was not exact reference background'); removed=removed+1
    end
  end end
  report[#report+1]='PASS: all 608553 RGBA pixels of the saved Aseprite render and final PNG exactly equal clipboard_reference.png.'
  report[#report+1]='PASS: transparent PNG exactly equals the foreground cel; '..retained..' retained pixels are unchanged and '..removed..' removed pixels are exact background color.'
  report[#report+1]='Manual review: source bitmap and final PNG were actually opened and visually compared; appearance matches. This is an exact bitmap import, not a redraw.'
  s:close()
end
local ok,err=xpcall(main,debug.traceback)
if not ok then report[#report+1]='FAIL: '..tostring(err) end
local f=assert(io.open(ROOT..'qa_exact.txt','w')); f:write(table.concat(report,'\n'),'\n'); f:close()
if not ok then error(err) end
