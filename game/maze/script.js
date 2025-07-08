// script.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io('/game/maze');

  // ——— State ———
  let solo=false, isHost=false, room='', userName='', playerColor='#00AAFF';
  let borderColor='#222222', maxLevels=1, curLevel=0;
  let layouts=[], players={}, keys={};

  const TILE_COUNT=25, settings={
    theme:localStorage.theme||'light',
    border:localStorage.border||'#222222'
  };

  // ——— Elements ———
  const $ = s=>document.querySelector(s);
  const screens = {
    choose:$('#choose'),
    create:$('#live-create'),
    join:$('#live-join'),
    lobby:$('#lobby-screen'),
    play:$('#play-screen'),
    map:$('#map-screen')
  };
  const E = {
    btnSolo:$('#btn-solo'), btnLive:$('#btn-live'),
    liveNameC:$('#live-name-create'), liveColorC:$('#live-color-create'),
    btnCreate:$('#btn-create'), btnToJoin:$('#btn-to-join'), errC:$('#live-err-create'),
    liveNameJ:$('#live-name-join'), liveColorJ:$('#live-color-join'),
    liveCode:$('#live-code'), btnJoin:$('#btn-join'), btnToCreate:$('#btn-to-create'),
    errJ:$('#live-err-join'),
    roomCode:$('#room-code'), playersList:$('#players-list'),
    viewMode:$('#view-mode'), levelCount:$('#level-count'),
    btnStart:$('#btn-start'),
    btnSet:$('#btn-settings'), modal:$('#settingsModal'),
    setBorder:$('#setting-border-color'), setTheme:$('#setting-theme'),
    setAudio:$('#setting-audio'), setSave:$('#settingsSave'),
    setCancel:$('#settingsCancel'),
    playC:$('#playCanvas'), mapC:$('#mapCanvas'), splash:$('#levelSplash'),
    leaderboard:$('#leaderboard')
  };
  const ctxPlay=E.playC.getContext('2d'),
        ctxMap =E.mapC.getContext('2d');

  function show(...a){a.forEach(i=>screens[i].classList.remove('hidden'))}
  function hide(...a){a.forEach(i=>screens[i].classList.add('hidden'))}

  // ——— Resize & Tiles ———
  let TILE, offX, offY;
  function resize(){
    [E.playC,E.mapC].forEach(c=>{
      c.width=innerWidth; c.height=innerHeight;
    });
    TILE=Math.min(innerWidth,innerHeight)/TILE_COUNT;
    const M=TILE_COUNT*TILE;
    offX=(innerWidth-M)/2; offY=(innerHeight-M)/2;
  }
  window.onresize=resize; resize();

  // ——— Settings ———
  function applySet(){
    document.body.className=settings.theme;
    borderColor=settings.border;
    E.btnSet.style.display=isHost?'block':'none';
    E.setTheme.value=settings.theme;
    E.setBorder.value=settings.border;
    E.setAudio.checked=!!settings.audio;
  }
  E.btnSet.onclick=()=>E.modal.classList.remove('hidden');
  E.setCancel.onclick=()=>E.modal.classList.add('hidden');
  E.setSave.onclick=()=>{
    settings.theme=E.setTheme.value;
    settings.border=E.setBorder.value;
    settings.audio=E.setAudio.checked;
    localStorage.theme=settings.theme;
    localStorage.border=settings.border;
    applySet();
    E.modal.classList.add('hidden');
  };

  // ——— Maze gen ———
  function genMaze(){
    const g=Array(TILE_COUNT).fill().map(()=>Array(TILE_COUNT).fill(0)),
          v=JSON.parse(JSON.stringify(g)),
          d=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){a.sort(()=>Math.random()-.5)}
    function carve(x,y){
      v[x][y]=1; g[x][y]=1; shuffle(d);
      d.forEach(([dx,dy])=>{
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

  // ——— Flows ———
  // Solo
  E.btnSolo.onclick=()=>{
    solo=true; userName='Solo'; playerColor='#00AAFF';
    layouts=[genMaze()]; players={me:{name:'Solo',pos:{x:0,y:0},color:playerColor}};
    show('play'); hide('choose'); applySet(); startPlay();
  };

  // Live: Create
  E.btnLive.onclick=()=>{ hide('choose'); show('create'); };
  E.btnToJoin.onclick=()=>{ hide('create'); show('join'); };
  E.btnCreate.onclick=()=>{
    const n=E.liveNameC.value.trim();
    const c=E.liveColorC.value;
    if(!n) return E.errC.innerText='Enter name',setTimeout(()=>E.errC.innerText='',2000);
    userName=n; playerColor=c;
    socket.emit('createRoom', {name,user:playerColor});
  };

  // Live: Join
  E.btnToCreate.onclick=()=>{ hide('join'); show('create'); };
  E.btnJoin.onclick=()=>{
    const n=E.liveNameJ.value.trim(),
          c=E.liveColorJ.value,
          code=E.liveCode.value.trim().toUpperCase();
    if(!n||!code) return E.errJ.innerText='Name & code',setTimeout(()=>E.errJ.innerText='',2000);
    userName=n; playerColor=c;
    socket.emit('joinRoom', {code,name:userName,color:playerColor});
  };

  // Lobby events
  socket.on('roomJoined', data=>{
    isHost=true; room=data.code; players=data.players;
    E.roomCode.innerText=room;
    renderPlayers();
    hide('create','join'); show('lobby');
    applySet();
  });
  socket.on('playersUpdate', pls=>{ players=pls; renderPlayers(); });
  socket.on('hostChanged', id=>{ isHost=(id===socket.id); applySet(); });

  function renderPlayers(){
    E.playersList.innerHTML='';
    Object.values(players).forEach(p=>{
      const li=document.createElement('li');
      li.innerHTML=`<span style="color:${p.color}">■</span> ${p.name}`;
      E.playersList.appendChild(li);
    });
  }

  // Start Game
  E.btnStart.onclick=()=>{
    if(!isHost) return;
    maxLevels=parseInt(E.levelCount.value)||1;
    layouts=Array.from({length:maxLevels},genMaze);
    curLevel=0;
    socket.emit('startGame',{code, maxLevels});
    hide('lobby');
    if(E.viewMode.value==='play') startPlay(); else startMap();
  };

  // Socket game events
  socket.on('gameStarted', data=>{
    players=data.players; layouts=Array.from({length:data.maxLevels},genMaze);
    curLevel=0; hide('lobby'); startPlay();
  });
  socket.on('playersUpdate', pls=>players=pls);

  socket.on('nextLevel', ()=>{
    curLevel++; resetPos(); startPlay();
  });
  socket.on('levelComplete', data=>{
    showMap(data.leaderboard);
  });

  // ——— Play & Map ———
  function startPlay(){
    resetPos(); hide('choose','create','join','lobby','map'); show('play');
    window.addEventListener('keydown',moveHandler);
    playLoop();
  }
  function startMap(){
    resetPos(); hide('play'); show('map'); mapLoop();
  }

  function resetPos(){
    Object.values(players).forEach(p=>p.pos={x:0,y:0});
  }
  function moveHandler(e){
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    const me=players[socket.id];
    let nx=me.pos.x,ny=me.pos.y;
    if(e.key==='ArrowUp') ny--;
    if(e.key==='ArrowDown') ny++;
    if(e.key==='ArrowLeft') nx--;
    if(e.key==='ArrowRight')nx++;
    if(nx<0||ny<0||nx>=TILE_COUNT||ny>=TILE_COUNT) return;
    if(!layouts[curLevel].some(w=>w.x===nx&&w.y===ny)){
      me.pos={x:nx,y:ny};
      socket.emit('playerMove',{code, pos:me.pos});
    }
  }

  function playLoop(){
    ctxPlay.clearRect(0,0,E.playC.width,E.playC.height);
    // draw walls
    ctxPlay.fillStyle=borderColor;
    layouts[curLevel].forEach(w=>{
      ctxPlay.fillRect(offX+w.x*TILE,offY+w.y*TILE,TILE,TILE);
    });
    // draw players
    Object.values(players).forEach(p=>{
      ctxPlay.fillStyle=p.color;
      ctxPlay.fillRect(offX+p.pos.x*TILE,offY+p.pos.y*TILE,TILE*0.8,TILE*0.8);
    });
    requestAnimationFrame(playLoop);
  }
  function mapLoop(){
    ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height);
    layouts[curLevel].forEach(w=>{
      ctxMap.fillStyle=borderColor;
      ctxMap.fillRect(offX+w.x*TILE,offY+w.y*TILE,TILE,TILE);
    });
    ctxMap.fillStyle='#0f0';
    Object.values(players).forEach(p=>{
      ctxMap.beginPath();
      ctxMap.arc(offX+p.pos.x*TILE+TILE/2,offY+p.pos.y*TILE+TILE/2,TILE/3,0,2*Math.PI);
      ctxMap.fill();
    });
    requestAnimationFrame(mapLoop);
  }

  function showMap(lb){
    hide('play'); show('map');
    E.leaderboard.innerHTML='<h3>Final</h3>';
    lb.forEach((p,i)=>{
      const d=document.createElement('div');
      d.innerText=`${i+1}. ${p.name}`;
      E.leaderboard.appendChild(d);
    });
  }

  applySet();
});