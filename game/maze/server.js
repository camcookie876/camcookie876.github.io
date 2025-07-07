// server.js (unchanged from previous)
const express = require('express'),
      http    = require('http'),
      path    = require('path'),
      { Server } = require('socket.io'),
      app     = express(),
      server  = http.createServer(app),
      io      = new Server(server);

const PORT = process.env.PORT||3000;
app.use('/game/maze', express.static(path.join(__dirname)));
  
const rooms = {};
function genCode(){ return Math.random().toString(36).substr(2,4).toUpperCase(); }
function generateMaze(r,c){
  const grid=Array(r).fill().map(()=>Array(c).fill(0));
  const vis=JSON.parse(JSON.stringify(grid));
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(a){a.sort(()=>Math.random()-.5);}
  function carve(x,y){
    vis[x][y]=1; grid[x][y]=1; shuffle(dirs);
    dirs.forEach(([dx,dy])=>{
      const nx=x+dx*2, ny=y+dy*2;
      if(nx>=0&&nx<r&&ny>=0&&ny<c&&!vis[nx][ny]){
        grid[x+dx][y+dy]=1; carve(nx,ny);
      }
    });
  }
  carve(0,0);
  const walls=[];
  for(let i=0;i<r;i++)for(let j=0;j<c;j++)
    if(!grid[i][j]) walls.push({x:j,y:i});
  return walls;
}

io.of('/game/maze').on('connection', sock=>{
  sock.on('createRoom', name=>{
    const code=genCode();
    rooms[code]={ host:sock.id, players:{}, maxLevels:1, layouts:[], current:0 };
    rooms[code].players[sock.id]={name,pos:{x:0,y:0},score:0};
    sock.join(code);
    sock.emit('roomJoined',{code,players:rooms[code].players});
  });
  sock.on('joinRoom', ({code,name})=>{
    const room=rooms[code]; if(!room) return sock.emit('error','No room');
    room.players[sock.id]={name,pos:{x:0,y:0},score:0};
    sock.join(code);
    io.of('/game/maze').in(code).emit('playersUpdate',room.players);
  });
  sock.on('setView', ({code,viewMode})=>{
    const r=rooms[code]; if(r&&r.host===sock.id) r.view=viewMode;
  });
  sock.on('startGame', ({code,maxLevels})=>{
    const r=rooms[code]; if(!r||r.host!==sock.id) return;
    r.maxLevels=maxLevels; r.current=0;
    r.layouts=Array.from({length:maxLevels}, ()=>generateMaze(25,25));
    Object.values(r.players).forEach(p=>{ p.pos={x:0,y:0}; p.score=0; });
    io.of('/game/maze').in(code).emit('gameStarted',{players:r.players});
  });
  sock.on('playerMove', ({code,pos})=>{
    const r=rooms[code], p=r&&r.players[sock.id]; if(!p) return;
    p.pos=pos;
    io.of('/game/maze').in(code).emit('playersUpdate',r.players);
    if(pos.x>=24&&pos.y>=24){
      p.score++;
      if(r.current+1<r.maxLevels){
        r.current++;
        Object.values(r.players).forEach(u=>u.pos={x:0,y:0});
        io.of('/game/maze').in(code).emit('nextLevel',{});
      } else {
        const lb=Object.values(r.players)
          .sort((a,b)=>b.score-a.score)
          .map(u=>({name:u.name,score:u.score}));
        io.of('/game/maze').in(code).emit('levelComplete',{leaderboard:lb});
      }
    }
  });
  sock.on('kick', ({code,targetId})=>{
    const r=rooms[code]; if(r&&r.host===sock.id&&r.players[targetId]){
      io.of('/game/maze').to(targetId).emit('error','You were kicked');
      delete r.players[targetId];
      io.of('/game/maze').in(code).emit('playersUpdate',r.players);
    }
  });
  sock.on('disconnect', ()=>{
    for(const code in rooms){
      const r=rooms[code];
      if(r.players[sock.id]){
        delete r.players[sock.id];
        io.of('/game/maze').in(code).emit('playersUpdate',r.players);
        if(r.host===sock.id){
          const ids=Object.keys(r.players);
          r.host=ids[0]||null;
          io.of('/game/maze').in(code).emit('hostChanged',r.host);
        }
        if(!Object.keys(r.players).length) delete rooms[code];
      }
    }
  });
});

server.listen(PORT,()=>console.log(`Listening on ${PORT}`));