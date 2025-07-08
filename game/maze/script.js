// script.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const choose      = el('choose'),
        liveCreate  = el('live-create'),
        liveJoin    = el('live-join'),
        lobby       = el('lobby'),
        play        = el('play'),
        canvas      = el('canvas'),
        ctx         = canvas.getContext('2d'),
        errCreate   = el('err-create'),
        errJoin     = el('err-join'),
        playersUl   = el('players'),
        roomSpan    = el('room-span');

  let solo=false, room='', meName='', mazeWalls=[], players={};

  const TILE_COUNT = 25;
  let TILE, offX, offY;

  function el(id){return document.getElementById(id)}
  function show(view){
    [choose,liveCreate,liveJoin,lobby,play].forEach(v=>v.classList.add('hidden'));
    view.classList.remove('hidden');
  }

  function resize(){
    canvas.width = innerWidth; canvas.height = innerHeight;
    TILE = Math.min(innerWidth,innerHeight)/TILE_COUNT;
    offX = (innerWidth - TILE*TILE_COUNT)/2;
    offY = (innerHeight - TILE*TILE_COUNT)/2;
  }
  window.onresize = resize; resize();

  // Solo
  el('btn-solo').onclick = ()=>{
    solo=true; mazeWalls = genMaze(25);
    show(play); draw();
  };

  // Live nav
  el('btn-live').onclick          = ()=>show(liveCreate);
  el('btn-goto-join').onclick     = ()=>show(liveJoin);
  el('btn-goto-create').onclick   = ()=>show(liveCreate);

  // Create Room
  el('btn-create').onclick = ()=>{
    const name = el('create-name').value.trim();
    if(!name){ errCreate.textContent='Enter name'; return setTimeout(()=>errCreate.textContent='',2000); }
    meName=name;
    socket.emit('createRoom',{name});
  };
  socket.on('roomCreated', data=>{
    room=data.code; players=data.players;
    roomSpan.textContent=room;
    renderPlayers();
    show(lobby);
  });

  // Join Room
  el('btn-join').onclick = ()=>{
    const name = el('join-name').value.trim(),
          code = el('join-code').value.trim().toUpperCase();
    if(!name||!code){ errJoin.textContent='Name & code'; return setTimeout(()=>errJoin.textContent='',2000);}
    meName=name; room=code;
    socket.emit('joinRoom',{code, name});
  };
  socket.on('joinError', msg=>{
    errJoin.textContent=msg; setTimeout(()=>errJoin.textContent='',2000);
  });

  socket.on('playersUpdate', data=>{
    players=data; renderPlayers();
  });

  // Start
  el('btn-start').onclick = ()=>{
    socket.emit('startGame',{code:room});
  };
  socket.on('gameStarted', data=>{
    mazeWalls=data.maze; players=data.players;
    show(play); draw();
  });

  function renderPlayers(){
    playersUl.innerHTML = '';
    Object.values(players).forEach(p=>{
      const li=document.createElement('li');
      li.textContent = p.name;
      playersUl.appendChild(li);
    });
  }

  // Movement
  document.addEventListener('keydown', e=>{
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    if(!players[socket.id]) return;
    e.preventDefault();
    let {x,y} = players[socket.id].pos || {x:0,y:0};
    if(e.key==='ArrowUp')    y--;
    if(e.key==='ArrowDown')  y++;
    if(e.key==='ArrowLeft')  x--;
    if(e.key==='ArrowRight') x++;
    if(x<0||y<0||x>=TILE_COUNT||y>=TILE_COUNT) return;
    if(mazeWalls.some(w=>w.x===x&&w.y===y)) return;
    players[socket.id].pos={x,y};
    socket.emit('playerMove', {code:room, pos:{x,y}});
  });

  socket.on('playersUpdate', data=>{
    players=data;
  });

  // Draw loop
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // walls
    ctx.fillStyle='#222';
    mazeWalls.forEach(w=>{
      ctx.fillRect(offX+w.x*TILE, offY+w.y*TILE, TILE, TILE);
    });
    // players
    for(const id in players){
      const p=players[id], col = id===socket.id?'#fff':p.color;
      const pos = p.pos || {x:0,y:0};
      ctx.fillStyle=col;
      ctx.fillRect(offX+pos.x*TILE, offY+pos.y*TILE, TILE*0.8, TILE*0.8);
    }
    requestAnimationFrame(draw);
  }

  // Maze gen
  function genMaze(size){
    const g=Array(size).fill().map(()=>Array(size).fill(0));
    const v=JSON.parse(JSON.stringify(g));
    const ds=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){a.sort(()=>Math.random()-.5)}
    function carve(x,y){
      v[y][x]=1; g[y][x]=1; shuffle(ds);
      ds.forEach(([dx,dy])=>{
        const nx=x+dx*2, ny=y+dy*2;
        if(nx>=0&&nx<size&&ny>=0&&ny<size&&!v[ny][nx]){
          g[y+dy][x+dx]=1; carve(nx,ny);
        }
      });
    }
    carve(0,0);
    const walls=[];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      if(g[y][x]===0) walls.push({x,y});
    }
    return walls;
  }

  // start
  show(choose);
});