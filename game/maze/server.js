// server.js
const express = require('express'),
      http    = require('http'),
      { Server } = require('socket.io'),
      path    = require('path'),
      app     = express(),
      server  = http.createServer(app),
      io      = new Server(server);

const PORT = process.env.PORT||3000;
app.use('/game/maze', express.static(path.join(__dirname)));

// In-memory rooms + reset
let rooms = {};

function scheduleReset(){
  const now = new Date(), midnight = new Date(now);
  midnight.setUTCDate(now.getUTCDate()+1);
  midnight.setUTCHours(0,0,0,0);
  setTimeout(()=>{
    rooms = {};
    io.of('/game/maze').emit('adminMessage','Room codes have been reset.');
    scheduleReset();
  }, midnight - now);
}
scheduleReset();

function genCode(){ return Math.random().toString(36).substr(2,4).toUpperCase(); }
function generateMaze(r,c){ /* same carve logic as client */ ... }

io.of('/game/maze').on('connection', sock=>{

  sock.on('createRoom', ({name,color})=>{
    // new unique code
    let code;
    do { code = genCode() } while(rooms[code]);
    rooms[code] = {
      host: sock.id, players:{}, maxLevels:1, layouts:[], current:0
    };
    rooms[code].players[sock.id] = {
      name, pos:{x:0,y:0}, color, score:0
    };
    sock.join(code);
    sock.emit('roomJoined',{ code, players: rooms[code].players });
  });

  sock.on('joinRoom', ({code,name,color})=>{
    const room = rooms[code];
    if(!room) return sock.emit('joinError','Room not found or expired.');
    // enforce unique username
    if(Object.values(room.players).some(p=>p.name===name))
      return sock.emit('joinError','Username taken. Choose another.');
    room.players[sock.id] = { name, pos:{x:0,y:0}, color, score:0 };
    sock.join(code);
    io.of('/game/maze').in(code).emit('playersUpdate',room.players);
  });

  sock.on('setView', ({code,viewMode})=>{
    if(rooms[code]?.host === sock.id) rooms[code].view = viewMode;
  });

  sock.on('startGame', ({code,maxLevels})=>{
    const room = rooms[code];
    if(!room || room.host!==sock.id) return;
    room.maxLevels = maxLevels; room.current=0;
    room.layouts = Array.from({length:maxLevels}, ()=>generateMaze(25,25));
    Object.values(room.players).forEach(p=>{
      p.pos={x:0,y:0}; p.score=0;
    });
    io.of('/game/maze').in(code).emit('gameStarted',{ players:room.players });
  });

  sock.on('playerMove', ({code,pos})=>{
    const room=rooms[code], p=room?.players[sock.id];
    if(!p) return;
    p.pos=pos;
    io.of('/game/maze').in(code).emit('playersUpdate',room.players);
    // level completion
    if(pos.x===24 && pos.y===24){
      p.score++;
      if(room.current+1 < room.maxLevels){
        room.current++;
        Object.values(room.players).forEach(u=>u.pos={x:0,y:0});
        io.of('/game/maze').in(code).emit('nextLevel',{});
      } else {
        const lb = Object.values(room.players)
          .sort((a,b)=>b.score-a.score)
          .map(u=>({name:u.name,score:u.score}));
        io.of('/game/maze').in(code).emit('levelComplete',{leaderboard:lb});
      }
    }
  });

  sock.on('kick', ({code,targetId})=>{
    const room=rooms[code];
    if(room?.host===sock.id && room.players[targetId]){
      io.of('/game/maze').to(targetId).emit('adminMessage','You were kicked.');
      delete room.players[targetId];
      io.of('/game/maze').in(code).emit('playersUpdate',room.players);
    }
  });

  sock.on('disconnect', ()=>{
    Object.entries(rooms).forEach(([code,room])=>{
      if(room.players[sock.id]){
        delete room.players[sock.id];
        io.of('/game/maze').in(code).emit('playersUpdate',room.players);
        if(room.host===sock.id){
          const ids=Object.keys(room.players);
          room.host=ids[0]||null;
          io.of('/game/maze').in(code).emit('hostChanged',room.host);
        }
        if(!ids.length) delete rooms[code];
      }
    });
  });

});

server.listen(PORT, ()=>console.log(`Listening on ${PORT}`));