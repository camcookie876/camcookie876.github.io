// server.js
const path    = require('path');
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// Serve static client from this folder
app.use('/', express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

// In-memory rooms
const rooms = {};

function genCode() {
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

// Maze generator (same as client)
function generateMaze(r=25,c=25) {
  const grid = Array(r).fill().map(()=>Array(c).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(a){ a.sort(() => Math.random() - .5); }
  function carve(x,y){
    vis[x][y]=1; grid[x][y]=1;
    shuffle(dirs);
    dirs.forEach(([dx,dy])=>{
      const nx=x+dx*2, ny=y+dy*2;
      if(nx>=0&&nx<r&&ny>=0&&ny<c && !vis[nx][ny]){
        grid[x+dx][y+dy]=1;
        carve(nx,ny);
      }
    });
  }
  carve(0,0);
  const walls = [];
  for(let i=0;i<r;i++){
    for(let j=0;j<c;j++){
      if(!grid[i][j]) walls.push({x:j,y:i});
    }
  }
  return walls;
}

io.on('connection', socket => {
  // Create Room
  socket.on('createRoom', ({ name, color })=>{
    const code = genCode();
    rooms[code] = {
      host: socket.id,
      players: {},
      layouts: [],
      current: 0,
      maxLevels: 1
    };
    rooms[code].players[socket.id] = {
      name, color, pos:{x:0,y:0}, score:0
    };
    socket.join(code);
    socket.emit('roomCreated', { code, players: rooms[code].players });
  });

  // Join Room
  socket.on('joinRoom', ({ code, name, color })=>{
    const room = rooms[code];
    if(!room) return socket.emit('joinError','Room not found.');
    // expire if started
    if(room.layouts.length) {
      return socket.emit('joinError','Game already started.');
    }
    // unique usernames
    if(Object.values(room.players).some(p=>p.name===name)) {
      return socket.emit('joinError','Username taken.');
    }
    room.players[socket.id] = { name, color, pos:{x:0,y:0}, score:0 };
    socket.join(code);
    io.in(code).emit('playersUpdate', room.players);
  });

  // Start Game
  socket.on('startGame', ({ code, maxLevels })=>{
    const room = rooms[code];
    if(!room || room.host !== socket.id) return;
    room.maxLevels = maxLevels;
    room.current   = 0;
    room.layouts   = Array.from({length:maxLevels},
                                ()=>generateMaze());
    // reset scores/positions
    Object.values(room.players).forEach(p=>{
      p.pos = {x:0,y:0};
      p.score = 0;
    });
    io.in(code).emit('gameStarted', {
      players: room.players,
      maxLevels
    });
  });

  // Player Move
  socket.on('playerMove', ({ code, pos })=>{
    const room = rooms[code];
    if(!room || !room.players[socket.id]) return;
    room.players[socket.id].pos = pos;
    io.in(code).emit('playersUpdate', room.players);
    // Check exit
    if(pos.x === 24 && pos.y === 24) {
      const p = room.players[socket.id];
      p.score++;
      if(room.current + 1 < room.maxLevels) {
        room.current++;
        Object.values(room.players).forEach(u=>u.pos={x:0,y:0});
        io.in(code).emit('nextLevel');
      } else {
        // Leaderboard
        const lb = Object.values(room.players)
          .sort((a,b)=>b.score - a.score)
          .map(u=>({name:u.name,score:u.score}));
        io.in(code).emit('gameOver', lb);
      }
    }
  });

  // Disconnect
  socket.on('disconnect', ()=>{
    for(const code in rooms){
      const room = rooms[code];
      if(room.players[socket.id]){
        delete room.players[socket.id];
        io.in(code).emit('playersUpdate', room.players);
        // If host leaves, assign new
        if(room.host === socket.id){
          const ids = Object.keys(room.players);
          room.host = ids[0] || null;
        }
        // cleanup empty
        if(!Object.keys(room.players).length){
          delete rooms[code];
        }
      }
    }
  });
});

server.listen(PORT, ()=>console.log(`Maze server on port ${PORT}`));