// script.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io('/game/maze');
  const $ = sel=>document.querySelector(sel);

  // STATE
  let solo=false, isHost=false, room='', userName='';
  let playerColor='#00AAFF', borderColor='#222222';
  let maxLv=1, curLv=0, layouts=[], players={}, settings={};
  const TILE_COUNT=25, SPEED=1;
  // Default Settings
  settings = JSON.parse(localStorage.getItem('mzSettings')|| JSON.stringify({
    theme:'light', borderColor:'#222222', audio:true
  }));

  // ELEMENTS
  const screens = {
    choose:$('#choose'), create:$('#live-create'),
    join:$('#live-join'), invalid:$('#invalid-qr'),
    lobby:$('#lobby-screen'), play:$('#play-screen'),
    map:$('#map-screen')
  };
  const E = {
    btnSolo:$('#btn-solo'), btnLive:$('#btn-live'),
    liveNameCreate:$('#live-name-create'), liveColorCreate:$('#live-color-create'),
    btnCreate:$('#btn-create'), btnToJoin:$('#btn-to-join'),
    errCreate:$('#live-err-create'),
    liveNameJoin:$('#live-name-join'), liveColorJoin:$('#live-color-join'),
    btnQRJoin:$('#btn-qr-join'), joinCodeEntry:$('#join-code-entry'),
    invalidCodeInput:$('#invalid-code-input'), invalidJoinBtn:$('#invalid-join-btn'),
    liveCode:$('#live-code'), btnJoin:$('#btn-join'),
    btnToCreate:$('#btn-to-create'), errJoin:$('#live-err-join'),
    roomCode:$('#room-code'), roomCodeCopy:$('#room-code-copy'),
    qrCode:$('#qr-code'), playersList:$('#players-list'),
    viewMode:$('#view-mode'), levelCount:$('#level-count'),
    btnStart:$('#btn-start'),
    btnSettings:$('#btn-settings'), settingsModal:$('#settingsModal'),
    settingTheme:$('#setting-theme'), settingBorder:$('#setting-border-color'),
    settingAudio:$('#setting-audio'), settingsSave:$('#settingsSave'),
    settingsCancel:$('#settingsCancel'),
    playC:$('#playCanvas'), mapC:$('#mapCanvas'),
    splash:$('#levelSplash'), timerDisp:$('#timerDisplay'),
    fpsCounter:$('#fpsCounter'), leaderboard:$('#leaderboard')
  };
  const ctxPlay=E.playC.getContext('2d'),
        ctxMap =E.mapC.getContext('2d');

  // UTILS
  function show(...ids){ ids.forEach(i=>screens[i].classList.remove('hidden')); }
  function hide(...ids){ ids.forEach(i=>screens[i].classList.add('hidden')); }
  function error(msg, where='create'){
    const el = where==='join'? E.errJoin : E.errCreate;
    el.innerText=msg; setTimeout(()=>el.innerText='',2000);
  }

  // RESIZE & OFFSET
  let TILE, ox, oy;
  function resize(){
    [E.playC,E.mapC].forEach(c=>{
      c.width=window.innerWidth;
      c.height=window.innerHeight;
    });
    TILE=Math.min(window.innerWidth,window.innerHeight)/TILE_COUNT;
    const mazeW=TILE_COUNT*TILE;
    ox=(window.innerWidth-mazeW)/2;
    oy=(window.innerHeight-mazeW)/2;
  }
  window.onresize=resize; resize();

  // SETTINGS
  function applySettings(){
    document.body.className=settings.theme;
    borderColor=settings.borderColor;
    E.btnSettings.style.display=isHost?'block':'none';
    E.settingTheme.value=settings.theme;
    E.settingBorder.value=settings.borderColor;
    E.settingAudio.checked=settings.audio;
  }
  function saveSettings(){
    settings.theme=E.settingTheme.value;
    settings.borderColor=E.settingBorder.value;
    settings.audio=E.settingAudio.checked;
    localStorage.setItem('mzSettings',JSON.stringify(settings));
    applySettings();
    E.settingsModal.classList.add('hidden');
  }
  E.btnSettings.onclick = ()=>E.settingsModal.classList.remove('hidden');
  E.settingsCancel.onclick = ()=>E.settingsModal.classList.add('hidden');
  E.settingsSave.onclick   = saveSettings;

  // MAZE GEN
  function generateMaze(){
    const grid=Array(TILE_COUNT).fill().map(()=>Array(TILE_COUNT).fill(0));
    const vis=JSON.parse(JSON.stringify(grid));
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){a.sort(()=>Math.random()-.5);}
    function carve(x,y){
      vis[x][y]=1; grid[x][y]=1;
      shuffle(dirs);
      dirs.forEach(([dx,dy])=>{
        const nx=x+dx*2, ny=y+dy*2;
        if(nx>=0&&nx<TILE_COUNT&&ny>=0&&ny<TILE_COUNT&&!vis[nx][ny]){
          grid[x+dx][y+dy]=1; carve(nx,ny);
        }
      });
    }
    carve(0,0);
    const walls=[];
    for(let i=0;i<TILE_COUNT;i++)for(let j=0;j<TILE_COUNT;j++)
      if(!grid[i][j]) walls.push({x:j,y:i});
    return walls;
  }

  // FLOW: CHOOSE
  E.btnSolo.onclick = ()=>{ solo=true; playerColor='#00AAFF'; startPlay(); };
  E.btnLive.onclick = ()=>{ hide('choose'); show('create'); };

  // LIVE CREATE
  E.btnToJoin.onclick = ()=>{ hide('create'); show('join'); };
  E.btnCreate.onclick = ()=>{
    const n=E.liveNameCreate.value.trim(),
          c=E.liveColorCreate.value;
    if(!n) return error('Enter name','create');
    socket.emit('createRoom',{ name:n, color:c });
  };

  // LIVE JOIN
  E.btnToCreate.onclick = ()=>{ hide('join'); show('create'); };
  E.btnQRJoin.onclick = ()=>{
    // assume QR code gave us ?live=room&name=...&color=...
    hide('join');
  };
  E.invalidJoinBtn.onclick = ()=>{
    const code=E.invalidCodeInput.value.trim().toUpperCase(),
          n=E.liveNameJoin.value.trim(),
          c=E.liveColorJoin.value;
    if(!n||!code) return error('All fields','join');
    socket.emit('joinRoom',{ name:n, color:c, code });
  };
  E.btnJoin.onclick = ()=>{
    const code=E.liveCode.value.trim().toUpperCase(),
          n=E.liveNameJoin.value.trim(),
          c=E.liveColorJoin.value;
    if(!n||!code) return error('Both required','join');
    socket.emit('joinRoom',{ name:n, color:c, code });
  };

  // SOCKET: LOBBY
  socket.on('roomJoined', data=>{
    isHost=true; room=data.code; players=data.players;
    E.roomCode.innerText=room;
    E.roomCodeCopy.innerText=room;
    renderPlayers();
    hide('create','join','invalid'); show('lobby');
    new QRCode(E.qrCode,{ text:`${location.origin}/game/maze/index.html?live=${room}&name=${encodeURIComponent(data.players[socket.id].name)}&color=${data.players[socket.id].color}`, width:128, height:128 });
    console.log('Share this URL or QR. Code expires on Start.');
    applySettings();
  });
  socket.on('playersUpdate', pls=>{ players=pls; renderPlayers() });
  socket.on('hostChanged', id=>{ isHost=(id===socket.id); applySettings(); });
  socket.on('joinError', msg=>{
    // invalid QR or code
    hide('create','join');
    show('invalid');
    error(msg,'join');
  });
  socket.on('createError', msg=>error(msg,'create'));

  function renderPlayers(){
    E.playersList.innerHTML='';
    Object.values(players).forEach(p=>{
      const li=document.createElement('li');
      li.innerHTML=`<span style="color:${p.color}">■</span> ${p.name}`;
      E.playersList.appendChild(li);
    });
    E.btnStart.style.display   = isHost?'inline-block':'none';
  }

  // START GAME => expire code
  E.btnStart.onclick = ()=>{
    if(!isHost) return;
    maxLv=parseInt(E.levelCount.value)||1;
    layouts=Array.from({length:maxLv},()=>generateMaze());
    curLv=0;
    socket.emit('startGame',{ code:room, maxLevels:maxLv });
    hide('lobby'); E.qrCode.innerHTML=''; // expire QR
    if(E.viewMode.value==='play') startPlay();
    else startMap();
  };

  // DIRECT QR JOIN
  (()=>{
    const p=new URLSearchParams(location.search),
          live=p.get('live'), nm=p.get('name'),
          col=p.get('color');
    if(live && nm && col){
      room=live;
      socket.emit('joinRoom',{ name:decodeURIComponent(nm), color:col, code:live });
    }
  })();

  // PLAY MODE
  function startPlay(){
    if(solo){
      playerColor='#00AAFF';
      players={ me:{ name:'Solo', pos:{x:0,y:0}, color:playerColor }};
    }
    curLv=0; showLevel(curLv); resetPositions();
    hide('choose','create','join','invalid','lobby','map'); show('play');
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(playLoop);
  }
  socket.on('gameStarted',data=>{
    players=data.players; curLv=0; showLevel(curLv); resetPositions();
  });
  socket.on('nextLevel',()=>{
    curLv++; showLevel(curLv); resetPositions();
  });
  socket.on('levelComplete',()=>console.log('Level done'));

  function showLevel(l){
    E.splash.innerText=`Level ${l+1}`;
    E.splash.style.animation='splashIn 1.2s ease-out';
    setTimeout(()=>E.splash.style.animation='',1200);
  }
  function resetPositions(){
    Object.values(players).forEach(p=>p.pos={x:0,y:0});
  }

  // MOVE & COLLISION
  function onKey(e){
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault(); moveOne(e.key);
  }
  function moveOne(dir){
    const meKey=solo?'me':socket.id, me=players[meKey]; if(!me) return;
    let nx=me.pos.x, ny=me.pos.y;
    if(dir==='ArrowUp') ny--; if(dir==='ArrowDown') ny++;
    if(dir==='ArrowLeft') nx--; if(dir==='ArrowRight') nx++;
    if(nx<0||nx>=TILE_COUNT||ny<0||ny>=TILE_COUNT) return;
    if(!layouts[curLv].some(w=>w.x===nx&&w.y===ny)){
      me.pos={x:nx,y:ny};
      if(!solo) socket.emit('playerMove',{ code:room, pos:me.pos });
    }
  }

  function playLoop(){
    ctxPlay.clearRect(0,0,E.playC.width,E.playC.height);
    const mw=TILE_COUNT*TILE, x0=ox, y0=oy;
    // draw border + exit gap
    ctxPlay.strokeStyle=borderColor; ctxPlay.lineWidth=2;
    ctxPlay.beginPath();
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0+mw,y0);
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0,y0+mw);
    ctxPlay.moveTo(x0+mw,y0); ctxPlay.lineTo(x0+mw,y0+mw);
    const ex=x0+(TILE_COUNT-1)*TILE, ey=y0+mw;
    ctxPlay.moveTo(x0,ey); ctxPlay.lineTo(ex,ey);
    ctxPlay.moveTo(ex+TILE,ey); ctxPlay.lineTo(x0+mw,ey);
    ctxPlay.stroke();

    // walls
    ctxPlay.fillStyle=borderColor;
    layouts[curLv].forEach(w=>{
      ctxPlay.fillRect(x0+w.x*TILE,y0+w.y*TILE,TILE,TILE);
    });

    // start & exit
    ctxPlay.fillStyle='lime'; ctxPlay.fillRect(x0,y0,TILE,TILE);
    ctxPlay.fillStyle='gold';ctxPlay.fillRect(ex,y0+(TILE_COUNT-1)*TILE,TILE,TILE);

    // players
    Object.values(players).forEach(p=>{
      const px=x0+p.pos.x*TILE, py=y0+p.pos.y*TILE;
      ctxPlay.fillStyle=p.color;
      ctxPlay.fillRect(px,py,TILE*0.8,TILE*0.8);
    });

    requestAnimationFrame(playLoop);
  }

  // MAP MODE
  function startMap(){
    resetPositions();
    hide('choose','create','join','invalid','lobby','play'); show('map');
    requestAnimationFrame(mapLoop);
  }
  socket.on('playersUpdate', pls=>players=pls);
  socket.on('levelComplete', data=>{
    E.leaderboard.innerHTML='<h3>Final</h3>';
    data.leaderboard.forEach((pl,i)=>{
      const d=document.createElement('div');
      d.innerText=`${i+1}. ${pl.name}`; E.leaderboard.appendChild(d);
    });
  });
  function mapLoop(){
    ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height);
    playLoop.call({ playC:E.mapC, playCtx:ctxMap });
    // draw dots
    ctxMap.fillStyle='#0f0';
    Object.values(players).forEach(p=>{
      const px=ox+p.pos.x*TILE+TILE/2,
            py=oy+p.pos.y*TILE+TILE/2;
      ctxMap.beginPath();
      ctxMap.arc(px,py,TILE/3,0,2*Math.PI);
      ctxMap.fill();
    });
    requestAnimationFrame(mapLoop);
  }

  applySettings();
});