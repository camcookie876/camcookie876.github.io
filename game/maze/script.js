// script.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let solo=false, isHost=false, room='', userName='', borderColor='#222';
  let layouts=[], players={}, curLevel=0, maxLevels=1;
  const TILE_COUNT=25;
  let TILE, offX, offY;

  const $ = s=>document.querySelector(s);
  const screens = {
    choose:$('#choose'), create:$('#live-create'), join:$('#live-join'),
    lobby:$('#lobby'), play:$('#play'), map:$('#map')
  };
  const E = {
    btnSolo:$('#btn-solo'), btnLive:$('#btn-live'),
    liveNameC:$('#live-name-create'), btnCreate:$('#btn-create'),
    btnToJoin:$('#btn-to-join'), errC:$('#live-err-create'),
    liveNameJ:$('#live-name-join'), liveCode:$('#live-code'),
    btnJoin:$('#btn-join'), btnToCreate:$('#btn-to-create'),
    errJ:$('#live-err-join'),
    roomCode:$('#room-code'), playersList:$('#players-list'),
    levelCount:$('#level-count'), btnStart:$('#btn-start'),
    btnSet:$('#btn-settings'), modal:$('#settingsModal'),
    setBorder:$('#setting-border'), setTheme:$('#setting-theme'),
    setSave:$('#settingsSave'), setCancel:$('#settingsCancel'),
    playC:$('#playCanvas'), mapC:$('#mapCanvas'), splash:$('#levelSplash'),
    leaderboard:$('#leaderboard')
  };
  const ctxP = E.playC.getContext('2d'),
        ctxM = E.mapC.getContext('2d');

  function show(screen){
    Object.values(screens).forEach(s=>s.classList.add('hidden'));
    screens[screen].classList.remove('hidden');
  }

  // Resize
  function resize(){
    [E.playC,E.mapC].forEach(c=>{c.width=innerWidth; c.height=innerHeight});
    TILE=Math.min(innerWidth,innerHeight)/TILE_COUNT;
    const M=TILE*TILE_COUNT; offX=(innerWidth-M)/2; offY=(innerHeight-M)/2;
  }
  window.onresize=resize; resize();

  // Settings
  E.btnSet.onclick=()=>E.modal.classList.toggle('hidden');
  E.setCancel.onclick=()=>E.modal.classList.toggle('hidden');
  E.setSave.onclick=()=>{
    borderColor=E.setBorder.value;
    document.body.className=E.setTheme.value;
    E.modal.classList.add('hidden');
  };

  // Maze gen
  function genMaze(){
    const g=Array(TILE_COUNT).fill().map(()=>Array(TILE_COUNT).fill(0));
    const v=JSON.parse(JSON.stringify(g));
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){a.sort(()=>Math.random()-.5)}
    function carve(x,y){
      v[x][y]=1; g[x][y]=1; shuffle(dirs);
      dirs.forEach(([dx,dy])=>{
        const nx=x+dx*2, ny=y+dy*2;
        if(nx>=0&&nx<TILE_COUNT&&ny>=0&&ny<TILE_COUNT&&!v[nx][ny]){
          g[x+dx][y+dy]=1;
          carve(nx,ny);
        }
      });
    }
    carve(0,0);
    const walls=[];
    for(let i=0;i<TILE_COUNT;i++)for(let j=0;j<TILE_COUNT;j++)
      if(!g[i][j]) walls.push({x:j,y:i});
    return walls;
  }

  // Flows
  E.btnSolo.onclick=()=>{
    solo=true; userName='Solo';
    players={'me':{name:'Solo',pos:{x:0,y:0},color:'#0af'}};
    layouts=[genMaze()]; show('play'); playLoop();
  };
  E.btnLive.onclick=()=>show('live-create');
  E.btnToJoin.onclick=()=>show('live-join');

  E.btnCreate.onclick=()=>{
    const n=E.liveNameC.value.trim();
    if(!n) return E.errC.innerText='Enter name',setTimeout(()=>E.errC.innerText='',2000);
    userName=n; socket.emit('createRoom',{name:n,color:'#0af'});
  };

  E.btnJoin.onclick=()=>{
    const n=E.liveNameJ.value.trim(), c=E.liveCode.value.trim().toUpperCase();
    if(!n||!c) return E.errJ.innerText='Name & code',
                   setTimeout(()=>E.errJ.innerText='',2000);
    userName=n; socket.emit('joinRoom',{code:c,name:n,color:'#f90'});
  };

  socket.on('roomCreated', data=>{
    isHost=true; room=data.code; players=data.players;
    E.roomCode.innerText=room; renderPlayers();
    show('lobby'); E.btnSet.style.display='block';
  });
  socket.on('playersUpdate', pls=>{ players=pls; renderPlayers() });

  E.btnStart.onclick=()=>{
    if(!isHost) return;
    maxLevels=parseInt(E.levelCount.value)||1;
    socket.emit('startGame',{code:room,maxLevels});
  };
  socket.on('gameStarted', data=>{
    players=data.players; layouts=Array.from({length:data.maxLevels},genMaze);
    show('play'); playLoop();
  });

  socket.on('playersUpdate', pls=>players=pls);

  // Render lobby
  function renderPlayers(){
    E.playersList.innerHTML='';
    Object.values(players).forEach(p=>{
      const li=document.createElement('li');
      li.innerHTML=`<span style="color:${p.color}">■</span> ${p.name}`;
      E.playersList.appendChild(li);
    });
  }

  // Movement & draw
  document.addEventListener('keydown', e=>{
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();
    const id = socket.id, me = players[id];
    if(!me) return;
    let nx=me.pos.x, ny=me.pos.y;
    if(e.key==='ArrowUp') ny--;
    if(e.key==='ArrowDown') ny++;
    if(e.key==='ArrowLeft') nx--;
    if(e.key==='ArrowRight') nx++;
    if(nx<0||ny<0||nx>=TILE_COUNT||ny>=TILE_COUNT) return;
    if(!layouts[curLevel].some(w=>w.x===nx&&w.y===ny)){
      me.pos={x:nx,y:ny};
      socket.emit('playerMove',{code:room,pos:me.pos});
    }
  });

  function playLoop(){
    ctxP.clearRect(0,0,E.playC.width,E.playC.height);
    // walls
    ctxP.fillStyle=borderColor;
    layouts[curLevel].forEach(w=>{
      ctxP.fillRect(offX+w.x*TILE,offY+w.y*TILE,TILE,TILE);
    });
    // players
    Object.values(players).forEach(p=>{
      ctxP.fillStyle=p.color;
      ctxP.fillRect(offX+p.pos.x*TILE,offY+p.pos.y*TILE,TILE*0.8,TILE*0.8);
    });
    requestAnimationFrame(playLoop);
  }

  show('choose');
});