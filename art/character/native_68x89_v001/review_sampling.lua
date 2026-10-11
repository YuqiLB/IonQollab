-- Internal sampling-alignment review, no editable sprite output.
local src=Image{fromFile='art/character/exact_reference_v001/portrait_exact_v001.png'}
local sheet=Image(68*4,89,ColorMode.RGB)
for i,phase in ipairs({0,0.25,0.5,0.75}) do
 for y=0,88 do for x=0,67 do
  sheet:drawPixel((i-1)*68+x,y,src:getPixel(math.floor((x+phase)*683/68),math.floor((y+phase)*891/89)))
 end end
end
local enlarged=Image(sheet.width*4,sheet.height*4,ColorMode.RGB)
for y=0,enlarged.height-1 do for x=0,enlarged.width-1 do
 enlarged:drawPixel(x,y,sheet:getPixel(math.floor(x/4),math.floor(y/4)))
end end
enlarged:saveAs('art/character/native_68x89_v001/sampling_review_4x.png')
