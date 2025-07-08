const express = require('express'),
      http = require('http'),
      path = require('path'),
      { Server } = require('socket.io');

const app = express(),
      srv = http.createServer(app),
      io  = new Server(srv);

const PORT = process.env.PORT||3000;
app.use('/game/maze', express.static(path.join(__dirname,'maze')));

const rooms = {};
function genCode(){ return Math.random().toString(36).slice(2,4).toUpperCase(); }
function genMaze(){ /* same JS carve logic as client */ /* ... */ }

io.of('/game/maze').on('connection', sock=>{
  sock.on('createRoom', name=>{
    const code = genCode();
    rooms[code] = { host:sock.id, players:{}, max:1, cur:0, labs:[] };
    rooms[code].players[sock.id]={name,pos:{x:0,y:0},score:0,color:'#0f0'};
    sock.join(code);
    sock.emit('roomJoined',{code,players:rooms[code].players});
  });
  sock.on('joinRoom', code=>{
    const r=rooms[code];
    if(!r) return sock.emit('joinError','No room');
    r.players[sock.id]={name:'Guest',pos:{x:0,y:0},score:0,color:'#f00'};
    sock.join(code);
    io.of('/game/maze').in(code).emit('playersUpdate',r.players);
  });
  sock.on('startGame', data=>{
    const r=rooms[data.code]; if(!r||r.host!==sock.id)return;
    r.max=data.maxLevels; r.cur=0;
    r.labs=Array.from({length:r.max},()=>genMaze());
    io.of('/game/maze').in(data.code).emit('gameStarted',{players:r.players,maxLevels:r.max});
  });
  sock.on('playerMove', data=>{
    const r=rooms[data.code]; if(!r||!r.players[sock.id])return;
    r.players[sock.id].pos=data.pos;
    io.of('/game/maze').in(data.code).emit('playersUpdate',r.players);
  });
});

srv.listen(PORT,()=>console.log(`Listening ${PORT}`));