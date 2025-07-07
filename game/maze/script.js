// script.js
document.addEventListener('DOMContentLoaded', () => {
  const ioPath = '/game/maze';
  const socket = io(ioPath);
  const $ = s => document.querySelector(s);

  // STATE
  let solo=false, isHost=false, room='', userName='';
  let playerColor='#00AAFF', mazeColor='#222222';
  let maxLevels=1, curLevel=0, layouts=[], players={}, keys={};
  const TILE_COUNT = 25;
  const SPEED = 1;

  const defaultSettings = {
    theme:'light', mazeColor:'#222222', audio:true
  };
  let settings = JSON.parse(localStorage.getItem('mzSettings')|| JSON.stringify(defaultSettings));

  // ELEMENTS
  const screens = {
    choose: $('#choose'), login: $('#live-login'),
    lobby: $('#lobby-screen'), play: $('#play-screen'),
    map: $('#map-screen')
  };
  const E = {
    // choose
    soloMazeColor: $('#solo-maze-color'),
    soloPlayerColor: $('#solo-player-color'),
    btnSolo: $('#btn-solo'), btnLive: $('#btn-live'),

    // live login
    liveName: $('#live-name'), liveColor: $('#live-color'),
    btnCreate: $('#btn-create'), btnQRJoin: $('#btn-qr-join'),
    btnJoinCode: $('#btn-join-code'), joinCodeEntry: $('#join-code-entry'),
    liveCode: $('#live-code'), btnJoin: $('#btn-join'),
    liveErr: $('#live-err'),

    // lobby
    roomCode: $('#room-code'), playersList: $('#players-list'),
    viewMode: $('#view-mode'), levelCount: $('#level-count'),
    btnStart: $('#btn-start'),

    // settings
    btnSettings: $('#btn-settings'), settingsModal: $('#settingsModal'),
    settingTheme: $('#setting-theme'), settingMazeColor: $('#setting-maze-color'),
    settingAudio: $('#setting-audio'), settingsSave: $('#settingsSave'),
    settingsCancel: $('#settingsCancel'),

    // play
    playC: $('#playCanvas'), splash: $('#levelSplash'),
    timerDisp: $('#timerDisplay'), fpsCounter: $('#fpsCounter'),

    // map
    mapC: $('#mapCanvas'), leaderboard: $('#leaderboard')
  };
  const ctxPlay = E.playC.getContext('2d');
  const ctxMap  = E.mapC.getContext('2d');

  // UTILS
  function show(...ids){ ids.forEach(i=>screens[i].classList.remove('hidden')); }
  function hide(...ids){ ids.forEach(i=>screens[i].classList.add('hidden')); }
  function err(msg){ E.liveErr.innerText=msg; setTimeout(()=>E.liveErr.innerText='',2000) }

  // RESIZE & TILE
  let TILE, offsetX, offsetY;
  function resize(){
    [E.playC,E.mapC].forEach(c=>{
      c.width=window.innerWidth; c.height=window.innerHeight;
    });
    TILE = Math.min(window.innerWidth,window.innerHeight)/TILE_COUNT;
    const mazeSize = TILE_COUNT * TILE;
    offsetX = (window.innerWidth - mazeSize)/2;
    offsetY = (window.innerHeight - mazeSize)/2;
  }
  window.onresize=resize;
  resize();

  // APPLY SETTINGS
  function applySettings(){
    document.body.className = settings.theme;
    mazeColor = settings.mazeColor;
    E.playC.style.background = settings.mazeColor;
    E.mapC.style.background = settings.mazeColor;
    E.btnSettings.style.display = isHost?'block':'none';
    // prefill modal
    E.settingTheme.value = settings.theme;
    E.settingMazeColor.value = settings.mazeColor;
    E.settingAudio.checked = settings.audio;
  }
  function saveSettings(){
    settings.theme = E.settingTheme.value;
    settings.mazeColor = E.settingMazeColor.value;
    settings.audio = E.settingAudio.checked;
    localStorage.setItem('mzSettings',JSON.stringify(settings));
    applySettings();
  }
  E.btnSettings.onclick = ()=>E.settingsModal.classList.remove('hidden');
  E.settingsCancel.onclick = ()=>E.settingsModal.classList.add('hidden');
  E.settingsSave.onclick = ()=>{
    saveSettings(); E.settingsModal.classList.add('hidden');
  };

  // MAZE GENERATOR
  function generateMaze(){
    const grid = Array(TILE_COUNT).fill().map(()=>Array(TILE_COUNT).fill(0));
    const vis  = JSON.parse(JSON.stringify(grid));
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){ a.sort(()=>Math.random()-.5) }
    function carve(x,y){
      vis[x][y]=1; grid[x][y]=1;
      shuffle(dirs);
      dirs.forEach(([dx,dy])=>{
        const nx=x+dx*2, ny=y+dy*2;
        if(nx>=0&&nx<TILE_COUNT&&ny>=0&&ny<TILE_COUNT&&!vis[nx][ny]){
          grid[x+dx][y+dy]=1;
          carve(nx,ny);
        }
      });
    }
    carve(0,0);
    const walls=[];
    for(let i=0;i<TILE_COUNT;i++){
      for(let j=0;j<TILE_COUNT;j++){
        if(!grid[i][j]) walls.push({x:j,y:i});
      }
    }
    return walls;
  }

  // UNIQUE USERNAMES
  function nameTaken(name){
    return Object.values(players).some(p=>p.name===name);
  }

  // FLOW: CHOOSE SOLO / LIVE
  E.btnSolo.onclick = ()=>{
    solo=true;
    playerColor = E.soloPlayerColor.value;
    settings.mazeColor = E.soloMazeColor.value;
    applySettings();
    startPlay();
  };
  E.btnLive.onclick = ()=>{ hide('choose'); show('login'); };

  // LIVE LOGIN
  E.btnCreate.onclick = ()=>{
    const n=E.liveName.value.trim();
    if(!n) return err('Enter name');
    socket.emit('createRoom', { name:n, color:E.liveColor.value });
  };
  E.btnQRJoin.onclick = ()=>{
    // already have room from QR param
    E.joinCodeEntry.classList.add('hidden');
    const n=E.liveName.value.trim();
    if(!n) return err('Enter name');
    socket.emit('joinRoom', { code:room, name:n, color:E.liveColor.value });
  };
  E.btnJoinCode.onclick = ()=>{
    E.joinCodeEntry.classList.remove('hidden');
  };
  E.btnJoin.onclick = ()=>{
    const n=E.liveName.value.trim(), code=E.liveCode.value.trim().toUpperCase();
    if(!n||!code) return err('Enter both');
    socket.emit('joinRoom', { code, name:n, color:E.liveColor.value });
  };

  // LOBBY
  socket.on('roomJoined', data=>{
    isHost=true; room=data.code; players=data.players;
    E.roomCode.innerText=room;
    renderPlayers();
    hide('login'); show('lobby');
    console.log('Admin: share this code or QR; codes expire at midnight UTC.');
    applySettings();
  });
  socket.on('playersUpdate', pls=>{
    players=pls; renderPlayers();
  });
  socket.on('hostChanged', id=>{
    isHost=(id===socket.id); renderPlayers(); applySettings();
  });
  socket.on('error', msg=>err(msg));

  function renderPlayers(){
    E.playersList.innerHTML='';
    Object.entries(players).forEach(([id,p])=>{
      const li=document.createElement('li');
      li.innerHTML=`<span style="color:${p.color}">■</span> ${p.name}` + (id===socket.id?' (you)':'');
      E.playersList.appendChild(li);
    });
    E.btnStart.style.display   = isHost?'inline-block':'none';
    E.viewMode.style.display   = isHost?'inline-block':'none';
    E.levelCount.style.display = isHost?'inline-block':'none';
  }

  // START GAME
  E.btnStart.onclick = ()=>{
    if(!isHost) return;
    maxLevels = parseInt(E.levelCount.value)||1;
    layouts = Array.from({length:maxLevels},()=>generateMaze());
    curLevel=0; players = {...players}; // keep colors
    socket.emit('startGame', { code:room, maxLevels });
    hide('lobby');
    if(E.viewMode.value==='play') startPlay();
    else startMap();
  };

  // DIRECT LINK via QR (?live=CODE)
  (()=>{
    const p=new URLSearchParams(location.search);
    const live=p.get('live'), nm=p.get('name'), col=p.get('color');
    if(live){
      room=live;
      if(nm && col){
        socket.emit('joinRoom',{ code:live, name:nm, color:col });
      } else {
        hide('choose'); show('login');
      }
    }
  })();

  // PLAY MODE
  function startPlay(){
    applySettings();
    if(solo){
      layouts=[generateMaze()];
      players={'me':{ name:'Solo', pos:{x:0,y:0}, color:playerColor }};
    }
    curLevel=0; showLevel(curLevel); resetPositions();
    hide('choose','login','lobby','map'); show('play');
    if(!solo && !nameTaken(userName)){
      // name was set on joinRoom ack
    }
    window.addEventListener('keydown', handleMove);
    requestAnimationFrame(playLoop);
  }
  socket.on('gameStarted', data=>{
    players=data.players; curLevel=0; showLevel(curLevel); resetPositions();
  });
  socket.on('nextLevel', ()=>{
    curLevel++; showLevel(curLevel); resetPositions();
  });
  socket.on('levelComplete', ()=>{ console.log('Level done!'); });

  function showLevel(l){
    E.splash.innerText=`Level ${l+1}`; 
    E.splash.style.animation='splashIn 1.2s ease-out';
    setTimeout(()=>E.splash.style.animation='',1200);
  }
  function resetPositions(){
    Object.values(players).forEach(p=>p.pos={x:0,y:0});
  }

  // MOVE HANDLER: one tile per key
  function handleMove(e){
    const dir = e.key;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(dir)) return;
    e.preventDefault();
    movePlayer(dir);
  }
  function movePlayer(dir){
    const meKey = solo?'me':socket.id;
    const me = players[meKey];
    if(!me) return;
    let nx=me.pos.x, ny=me.pos.y;
    if(dir==='ArrowUp')    ny--;
    if(dir==='ArrowDown')  ny++;
    if(dir==='ArrowLeft')  nx--;
    if(dir==='ArrowRight') nx++;
    if(nx<0||nx>=TILE_COUNT||ny<0||ny>=TILE_COUNT) return;
    if(!collides(nx,ny)){
      me.pos.x=nx; me.pos.y=ny;
      if(!solo) socket.emit('playerMove',{ code:room, pos:me.pos });
    }
  }

  // COLLISION
  function collides(x,y){
    const size = TILE*0.8, px = offsetX + x*TILE, py = offsetY + y*TILE;
    return layouts[curLevel].some(w=>{
      const wx=offsetX+w.x*TILE, wy=offsetY+w.y*TILE;
      return px < wx+TILE && px+size > wx && py < wy+TILE && py+size > wy;
    });
  }

  // PLAY LOOP
  function playLoop(){
    ctxPlay.clearRect(0,0,E.playC.width,E.playC.height);
    // draw border w/ exit gap
    const mazeW=TILE_COUNT*TILE, mazeH=mazeW;
    // top
    ctxPlay.strokeStyle='#fff'; ctxPlay.lineWidth=2;
    ctxPlay.beginPath();
    ctxPlay.moveTo(offsetX,offsetY);
    ctxPlay.lineTo(offsetX+mazeW,offsetY);
    ctxPlay.stroke();
    // left
    ctxPlay.beginPath();
    ctxPlay.moveTo(offsetX,offsetY);
    ctxPlay.lineTo(offsetX,offsetY+mazeH);
    ctxPlay.stroke();
    // right
    ctxPlay.beginPath();
    ctxPlay.moveTo(offsetX+mazeW,offsetY);
    ctxPlay.lineTo(offsetX+mazeW,offsetY+mazeH);
    ctxPlay.stroke();
    // bottom w/ exit gap at (TILE_COUNT-1,TILE_COUNT-1)
    const ex=offsetX+(TILE_COUNT-1)*TILE, ey=offsetY+mazeH;
    ctxPlay.beginPath();
    ctxPlay.moveTo(offsetX,ey);
    ctxPlay.lineTo(ex,ey);
    ctxPlay.moveTo(ex+TILE,ey);
    ctxPlay.lineTo(offsetX+mazeW,ey);
    ctxPlay.stroke();

    // draw walls
    ctxPlay.fillStyle=mazeColor;
    layouts[curLevel].forEach(w=>{
      ctxPlay.fillRect(offsetX+w.x*TILE, offsetY+w.y*TILE, TILE, TILE);
    });
    // highlight start & exit
    ctxPlay.fillStyle='lime';
    ctxPlay.fillRect(offsetX+0*TILE, offsetY+0*TILE, TILE, TILE);
    ctxPlay.fillStyle='gold';
    ctxPlay.fillRect(ex, offsetY+(TILE_COUNT-1)*TILE, TILE, TILE);

    // draw players
    Object.values(players).forEach(p=>{
      const px=offsetX+p.pos.x*TILE, py=offsetY+p.pos.y*TILE;
      ctxPlay.fillStyle=p.color;
      ctxPlay.fillRect(px, py, TILE*0.8, TILE*0.8);
    });

    requestAnimationFrame(playLoop);
  }

  // MAP MODE
  function startMap(){
    applySettings(); resetPositions();
    hide('choose','login','lobby','play'); show('map');
    requestAnimationFrame(mapLoop);
  }
  socket.on('playersUpdate', pls=>players=pls);
  socket.on('levelComplete', data=>{
    E.leaderboard.innerHTML='<h3>Final</h3>';
    data.leaderboard.forEach((p,i)=>{
      const d=document.createElement('div');
      d.innerText=`${i+1}. ${p.name}`;
      E.leaderboard.appendChild(d);
    });
  });
  function mapLoop(){
    ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height);
    // same border+walls
    playLoop.call({ canvas:E.mapC, ctx:ctxMap });
    // but draw dots
    ctxMap.fillStyle='#0f0';
    Object.values(players).forEach(p=>{
      const px=offsetX+p.pos.x*TILE+TILE/2;
      const py=offsetY+p.pos.y*TILE+TILE/2;
      ctxMap.beginPath();
      ctxMap.arc(px,py,TILE/3,0,2*Math.PI);
      ctxMap.fill();
    });
    requestAnimationFrame(mapLoop);
  }

  // UNIQUE USER & COLOR
  socket.on('roomJoined', data=>{
    userName = data.players[socket.id].name;
    playerColor = data.players[socket.id].color;
  });
  socket.on('joinError', msg=>err(msg));

  // SCHEDULE RESET AT MIDNIGHT UTC
  (function scheduleReset(){
    const now=new Date(), midnight=new Date(now);
    midnight.setUTCDate(now.getUTCDate()+1);
    midnight.setUTCHours(0,0,0,0);
    setTimeout(()=>{
      socket.emit('adminMessage','Codes expired at midnight UTC.');
      window.location.reload();
      scheduleReset();
    }, midnight - now);
  })();

  // INIT
  applySettings();
});