// server.js
const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files under /game/maze
app.use('/game/maze', express.static(path.join(__dirname)));

let rooms = {};

// Reset rooms & codes at midnight UTC
function scheduleReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(now.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  setTimeout(() => {
    rooms = {};
    io.of('/game/maze').emit('adminMessage', 'Room codes have been reset.');
    scheduleReset();
  }, midnight - now);
}
scheduleReset();

// Utility: generate a 4-letter uppercase code
function genCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Maze generator (DFS carve)
function generateMaze(rows, cols) {
  const grid = Array(rows).fill().map(() => Array(cols).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }
  function carve(r, c) {
    vis[r][c] = 1;
    grid[r][c] = 1;
    shuffle(dirs);
    for (const [dr, dc] of dirs) {
      const nr = r + dr*2, nc = c + dc*2;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !vis[nr][nc]) {
        grid[r+dr][c+dc] = 1;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
  const walls = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!grid[i][j]) walls.push({ x: j, y: i });
    }
  }
  return walls;
}

io.of('/game/maze').on('connection', sock => {
  // Create a new room (admin)
  sock.on('createRoom', ({ name, color }) => {
    let code;
    do { code = genCode(); } while (rooms[code]);
    rooms[code] = {
      host: sock.id,
      players: {},
      maxLevels: 1,
      layouts: [],
      current: 0
    };
    rooms[code].players[sock.id] = { name, pos: { x: 0, y: 0 }, color, score: 0 };
    sock.join(code);
    sock.emit('roomJoined', { code, players: rooms[code].players });
  });

  // Join an existing room
  sock.on('joinRoom', ({ code, name, color }) => {
    const room = rooms[code];
    if (!room) return sock.emit('joinError', 'Room not found or expired.');
    // Expire code once game has started
    if (room.layouts.length > 0) {
      return sock.emit('joinError', 'Game already started; code expired.');
    }
    // Enforce unique username
    if (Object.values(room.players).some(p => p.name === name)) {
      return sock.emit('joinError', 'Username taken; choose another.');
    }
    room.players[sock.id] = { name, pos: { x: 0, y: 0 }, color, score: 0 };
    sock.join(code);
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);
  });

  // Only host can change view mode
  sock.on('setView', ({ code, viewMode }) => {
    const room = rooms[code];
    if (room && room.host === sock.id) {
      room.view = viewMode;
    }
  });

  // Start the game: generate mazes
  sock.on('startGame', ({ code, maxLevels }) => {
    const room = rooms[code];
    if (!room || room.host !== sock.id) return;
    room.maxLevels = maxLevels;
    room.current   = 0;
    room.layouts   = Array.from({ length: maxLevels }, () => generateMaze(25, 25));
    Object.values(room.players).forEach(p => {
      p.pos = { x: 0, y: 0 };
      p.score = 0;
    });
    io.of('/game/maze').in(code).emit('gameStarted', { players: room.players });
  });

  // Handle player movement and level progression
  sock.on('playerMove', ({ code, pos }) => {
    const room = rooms[code];
    const player = room?.players[sock.id];
    if (!player) return;
    player.pos = pos;
    io.of('/game/maze').in(code).emit('playersUpdate', room.players);
    // Check if reached exit at (24,24)
    if (pos.x === 24 && pos.y === 24) {
      player.score++;
      if (room.current + 1 < room.maxLevels) {
        room.current++;
        Object.values(room.players).forEach(p => p.pos = { x: 0, y: 0 });
        io.of('/game/maze').in(code).emit('nextLevel', {});
      } else {
        const leaderboard = Object.values(room.players)
          .sort((a, b) => b.score - a.score)
          .map(p => ({ name: p.name, score: p.score }));
        io.of('/game/maze').in(code).emit('levelComplete', { leaderboard });
      }
    }
  });

  // Host can kick players
  sock.on('kick', ({ code, targetId }) => {
    const room = rooms[code];
    if (room && room.host === sock.id && room.players[targetId]) {
      io.of('/game/maze').to(targetId).emit('adminMessage', 'You were kicked from the room.');
      delete room.players[targetId];
      io.of('/game/maze').in(code).emit('playersUpdate', room.players);
    }
  });

  // Cleanup on disconnect
  sock.on('disconnect', () => {
    Object.entries(rooms).forEach(([code, room]) => {
      if (room.players[sock.id]) {
        delete room.players[sock.id];
        io.of('/game/maze').in(code).emit('playersUpdate', room.players);
        // If host left, assign new host
        if (room.host === sock.id) {
          const ids = Object.keys(room.players);
          room.host = ids[0] || null;
          io.of('/game/maze').in(code).emit('hostChanged', room.host);
        }
        // Delete empty room
        if (!Object.keys(room.players).length) {
          delete rooms[code];
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Camcookie Maze server listening on port ${PORT}`);
});
```