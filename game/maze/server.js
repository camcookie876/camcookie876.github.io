// server.js

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');
const app     = express();
const server  = http.createServer(app);
const io      = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve all files in /maze at path /game/maze
app.use('/game/maze', express.static(path.join(__dirname, '')));

// Room state
const rooms = {};  // code→{ hostId, viewMode, players, level, layout, leaderboard }

// Sample levels
const LEVELS = [
  [ {x:5,y:5,w:1,h:15}, {x:10,y:0,w:1,h:10} ],
  [ {x:3,y:0,w:1,h:20}, {x:15,y:5,w:1,h:15}, {x:8,y:8,w:10,h:1} ],
  [ {x:0,y:12,w:20,h:1}, {x:12,y:0,w:1,h:20} ]
];

function genCode(){ return Math.random().toString(36).substr(2,4).toUpperCase(); }

io.of('/game/maze').on('connection', socket => {
  socket.on('createRoom', name => {
    const code = genCode();
    rooms[code] = {
      hostId: socket.id,
      viewMode: 'play',
      players: {},
      level: 0,
      layout: LEVELS[0],
      leaderboard: []
    };
    socket.join(code);
    rooms[code].players[socket.id] = { name, pos:{x:0,y:0}, score:0 };
    socket.emit('roomJoined',{ code, players: rooms[code].players });
  });

  socket.on('joinRoom', ({ code, name }) => {
    const room = rooms[code];
    if(!room) return socket.emit('error','Room not found');
    socket.join(code);
    room.players[socket.id] = { name, pos:{x:0,y:0}, score:0 };
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);
  });

  socket.on('setView', ({ code, viewMode }) => {
    const room = rooms[code];
    if(room && room.hostId===socket.id){
      room.viewMode = viewMode;
      io.of('/game/maze').in(code).emit('viewChanged', viewMode);
    }
  });

  socket.on('startGame', code => {
    const room = rooms[code];
    if(!room || room.hostId!==socket.id) return;
    room.level = 0;
    room.layout = LEVELS[0];
    room.leaderboard = [];
    // reset players
    Object.values(room.players).forEach(p=>{ p.pos={x:0,y:0}; p.score=0 });
    io.of('/game/maze').in(code).emit('gameStarted',{
      level: room.level, layout: room.layout, players: room.players
    });
  });

  socket.on('playerMove', ({ code, pos }) => {
    const room = rooms[code];
    if(!room || !room.players[socket.id]) return;
    room.players[socket.id].pos = pos;
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);
    // simple goal: pos.x>19 or pos.y>19
    if(pos.x>=24 || pos.y>=24){
      const winner = room.players[socket.id].name;
      room.players[socket.id].score++;
      room.leaderboard.push({ name: winner, time: Date.now() });
      io.of('/game/maze').in(code).emit('levelComplete',{
        winner, leaderboard: room.leaderboard
      });
      // next level
      room.level = Math.min(room.level+1, LEVELS.length-1);
      room.layout = LEVELS[room.level];
      // reset positions
      Object.values(room.players).forEach(p=> p.pos={x:0,y:0});
      io.of('/game/maze').in(code).emit('nextLevel',{
        level: room.level, layout: room.layout
      });
    }
  });

  socket.on('kick', ({ code, targetId }) => {
    const room = rooms[code];
    if(room && room.hostId===socket.id && room.players[targetId]){
      io.of('/game/maze').to(targetId).emit('error','You were kicked');
      delete room.players[targetId];
      io.of('/game/maze').in(code).emit('playersUpdate', room.players);
    }
  });

  socket.on('disconnect', () => {
    for(let code in rooms){
      const room = rooms[code];
      if(room.players[socket.id]){
        delete room.players[socket.id];
        io.of('/game/maze').in(code).emit('playersUpdate', room.players);
        if(room.hostId===socket.id){
          const ids = Object.keys(room.players);
          room.hostId = ids[0]||null;
          io.of('/game/maze').in(code).emit('hostChanged', room.hostId);
        }
        if(Object.keys(room.players).length===0){
          delete rooms[code];
        }
      }
    }
  });
});

server.listen(PORT, ()=> console.log(`Camcookie Maze server on port ${PORT}`));