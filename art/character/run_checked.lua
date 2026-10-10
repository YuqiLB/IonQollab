local ok,err=xpcall(function() dofile('art/character/create_character.lua') end,debug.traceback)
local f=assert(io.open('art/character/run-log.txt','w'))
f:write(ok and 'OK' or tostring(err)); f:close()
