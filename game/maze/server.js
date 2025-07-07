// server.js

const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from /maze at /game/maze
app.use('/game/maze', express.static(path.join(__dirname)));

// In-memory room store
const rooms = {};

// Utility: generate 4-letter room code
function genCode() {
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

// Maze generator: same logic as client
function generateMaze(r, c) {
  const grid = Array(r).fill().map(()=>Array(c).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(a){ a.sort(()=>Math.random()-0.5); }
  function carve(x,y){
    vis[x][y] = 1; grid[x][y] = 1;
    shuffle(dirs);
    dirs.forEach(([dx,dy]) => {
      const nx = x + dx*2, ny = y + dy*2;
      if (nx>=0 && nx<r && ny>=0 && ny<c && !vis[nx][ny]) {
        grid[x+dx][y+dy] = 1;
        carve(nx, ny);
      }
    });
  }
  carve(0,0);
  const walls = [];
  for (let i=0;i<r;i++){
    for (let j=0;j<c;j++){
      if (!grid[i][j]) walls.push({ x:j, y:i });
    }
  }
  return walls;
}

// Namespacing under /game/maze
io.of('/game/maze').on('connection', sock => {

  // Create room
  sock.on('createRoom', name => {
    const code = genCode();
    rooms[code] = {
      host: sock.id,
      players: {},
      maxLevels: 1,
      layouts: [],
      current: 0
    };
    sock.join(code);
    rooms[code].players[sock.id] = { name, pos:{x:0,y:0}, score:0 };
    sock.emit('roomJoined', { code, players: rooms[code].players });
  });

  // Join room
  sock.on('joinRoom', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return sock.emit('error', 'Room not found');
    room.players[sock.id] = { name, pos:{x:0,y:0}, score:0 };
    sock.join(code);
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);
  });

  // Only host sets view mode
  sock.on('setView', ({ code, viewMode }) => {
    const room = rooms[code];
    if (room && room.host === sock.id) {
      room.view = viewMode;
    }
  });

  // Host starts game and generates mazes
  sock.on('startGame', ({ code, maxLevels }) => {
    const room = rooms[code];
    if (!room || room.host !== sock.id) return;
    room.maxLevels = maxLevels;
    room.current   = 0;
    room.layouts   = Array.from({length:maxLevels}, () => generateMaze(25,25));
    Object.values(room.players).forEach(p => {
      p.pos = { x:0, y:0 };
      p.score = 0;
    });
    io.of('/game/maze').in(code).emit('gameStarted', { players: room.players });
  });

  // Player movement
  sock.on('playerMove', ({ code, pos }) => {
    const room = rooms[code];
    if (!room || !room.players[sock.id]) return;
    room.players[sock.id].pos = pos;
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);

    // Goal = bottom-right cell
    if (pos.x >= 24 && pos.y >= 24) {
      room.players[sock.id].score++;
      // Next level?
      if (room.current + 1 < room.maxLevels) {
        room.current++;
        // reset positions
        Object.values(room.players).forEach(p => p.pos = { x:0, y:0 });
        io.of('/game/maze').in(code).emit('nextLevel', {});
      } else {
        // All done → leaderboard
        const lb = Object.values(room.players)
          .sort((a,b) => b.score - a.score)
          .map(p => ({ name: p.name, score: p.score }));
        io.of('/game/maze').in(code).emit('levelComplete', { leaderboard: lb });
      }
    }
  });

  // Kick a player
  sock.on('kick', ({ code, targetId }) => {
    const room = rooms[code];
    if (room && room.host === sock.id && room.players[targetId]) {
      io.of('/game/maze').to(targetId).emit('error','You were kicked');
      delete room.players[targetId];
      io.of('/game/maze').in(code).emit('playersUpdate', room.players);
    }
  });

  // Cleanup on disconnect
  sock.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.players[sock.id]) {
        delete room.players[sock.id];
        io.of('/game/maze').in(code).emit('playersUpdate', room.players);
        // new host?
        if (room.host === sock.id) {
          const ids = Object.keys(room.players);
          room.host = ids[0] || null;
          io.of('/game/maze').in(code).emit('hostChanged', room.host);
        }
        // delete empty room
        if (!Object.keys(room.players).length) {
          delete rooms[code];
        }
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Camcookie Maze server listening on port ${PORT}`);
});