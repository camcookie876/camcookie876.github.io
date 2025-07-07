// script.js

document.addEventListener('DOMContentLoaded', () => {
  const socket = io('/game/maze');
  const $ = s => document.querySelector(s);

  // STATE
  let solo=false, isHost=false, room='', name='';
  let maxLv=1, curLv=0, layouts=[], players={}, keys={};
  const speed=1;
  const defaultSettings = {
    theme:'light', audio:true, timer:false,
    timerDuration:60, showFPS:false, hints:true
  };
  let settings = JSON.parse(localStorage.getItem('mzSettings')|| JSON.stringify(defaultSettings));

  // ELEMENTS
  const screens = {
    choose:$('#choose'), login:$('#live-login'),
    lobby:$('#lobby-screen'), play:$('#play-screen'),
    map:$('#map-screen')
  };
  const E = {
    btnSolo:$('#btn-solo'), btnLive:$('#btn-live'),
    btnCreate:$('#btn-create'), btnJoin:$('#btn-join'),
    btnStart:$('#btn-start'), nameIn:$('#live-name'),
    codeIn:$('#live-code'), errLive:$('#live-err'),
    playersList:$('#players-list'), roomCode:$('#room-code'),
    viewMode:$('#view-mode'), levelCount:$('#level-count'),
    shareLink:$('#share-link'), btnSettings:$('#btn-settings'),
    settingsModal:$('#settingsModal'),
    settingTheme:$('#setting-theme'),
    settingAudio:$('#setting-audio'),
    settingTimer:$('#setting-timer'),
    settingTimerDur:$('#setting-timer-duration'),
    settingFPS:$('#setting-show-fps'),
    settingHints:$('#setting-hints'),
    settingsSave:$('#settingsSave'),
    settingsCancel:$('#settingsCancel'),
    playC:$('#playCanvas'), mapC:$('#mapCanvas'),
    splash:$('#levelSplash'),
    timerDisp:$('#timerDisplay'),
    fpsCounter:$('#fpsCounter'),
    leaderboard:$('#leaderboard')
  };
  const ctxPlay = E.playC.getContext('2d');
  const ctxMap  = E.mapC.getContext('2d');

  // UTILS
  function show(...ids){ ids.forEach(id=>screens[id].classList.remove('hidden')); }
  function hide(...ids){ ids.forEach(id=>screens[id].classList.add('hidden')); }
  function error(msg){ E.errLive.innerText=msg; setTimeout(()=>E.errLive.innerText='',2000); }

  // RESIZE
  let tile;
  function resize(){
    [E.playC,E.mapC].forEach(c=>{
      c.width=window.innerWidth; c.height=window.innerHeight;
    });
    tile = Math.min(window.innerWidth,window.innerHeight)/25;
  }
  window.addEventListener('resize', resize);
  resize();

  // SETTINGS
  function applySettings(){
    document.body.className = settings.theme;
    E.timerDisp.classList.toggle('hidden',!settings.timer);
    E.fpsCounter.classList.toggle('hidden',!settings.showFPS);
    E.btnSettings.classList.remove('hidden');
    E.settingTheme.value = settings.theme;
    E.settingAudio.checked = settings.audio;
    E.settingTimer.checked = settings.timer;
    E.settingTimerDur.value = settings.timerDuration;
    E.settingFPS.checked = settings.showFPS;
    E.settingHints.checked = settings.hints;
  }
  function saveSettings(){
    settings.theme = E.settingTheme.value;
    settings.audio = E.settingAudio.checked;
    settings.timer = E.settingTimer.checked;
    settings.timerDuration = parseInt(E.settingTimerDur.value)||60;
    settings.showFPS = E.settingFPS.checked;
    settings.hints = E.settingHints.checked;
    localStorage.setItem('mzSettings',JSON.stringify(settings));
    applySettings();
  }
  E.btnSettings.addEventListener('click',()=>E.settingsModal.classList.remove('hidden'));
  E.settingsCancel.addEventListener('click',()=>E.settingsModal.classList.add('hidden'));
  E.settingsSave.addEventListener('click',()=>{
    saveSettings();
    E.settingsModal.classList.add('hidden');
  });

  // MAZE GENERATOR
  function generateMaze(r,c){
    const grid=Array(r).fill().map(()=>Array(c).fill(0));
    const vis = JSON.parse(JSON.stringify(grid));
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(a){ a.sort(()=>Math.random()-.5); }
    function carve(x,y){
      vis[x][y]=1; grid[x][y]=1;
      shuffle(dirs);
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

  // FLOW: 1) SOLO / LIVE
  E.btnSolo.addEventListener('click',()=>{ solo=true; startPlay(); });
  E.btnLive.addEventListener('click',()=>{ hide('choose'); show('login'); });

  // 2) LIVE LOGIN
  E.btnCreate.addEventListener('click',()=>{
    name=E.nameIn.value.trim(); if(!name)return error('Enter name');
    socket.emit('createRoom',name);
  });
  E.btnJoin.addEventListener('click',()=>{
    name=E.nameIn.value.trim(); room=E.codeIn.value.trim().toUpperCase();
    if(!name||!room)return error('Name & code required');
    socket.emit('joinRoom',{code:room,name});
  });

  // LOBBY
  socket.on('roomJoined',data=>{
    isHost=true; room=data.code; players=data.players;
    E.roomCode.innerText=room; renderPlayers();
    hide('login'); show('lobby');
    E.shareLink.value=`https://camcookie876.github.io/game/maze/index.html?live=${room}&name=${name}`;
  });
  socket.on('playersUpdate', pls=>{ players=pls; renderPlayers(); });
  socket.on('hostChanged', id=>{ isHost=(id===socket.id); renderPlayers(); });

  function renderPlayers(){
    E.playersList.innerHTML='';
    Object.entries(players).forEach(([id,p])=>{
      const li=document.createElement('li');
      li.innerText=p.name+(id===socket.id?' (you)':'');
      if(isHost&&id!==socket.id){
        const b=document.createElement('button');
        b.innerText='Kick'; b.addEventListener('click',()=>{
          socket.emit('kick',{code:room,targetId:id});
        });
        li.appendChild(b);
      }
      E.playersList.appendChild(li);
    });
    E.btnStart.style.display   = isHost?'inline-block':'none';
    E.levelCount.style.display = isHost?'inline-block':'none';
    E.viewMode.style.display   = isHost?'inline-block':'none';
  }

  // START GAME
  E.btnStart.addEventListener('click',()=>{
    if(!isHost)return;
    maxLv=parseInt(E.levelCount.value)||1;
    layouts=Array.from({length:maxLv},()=>generateMaze(25,25));
    curLv=0;
    socket.emit('setView',{code:room,viewMode:E.viewMode.value});
    socket.emit('startGame',{code:room,maxLevels:maxLv});
    hide('lobby');
    E.viewMode.value==='play'?startPlay():startMap();
  });

  // DIRECT LINK
  (()=>{
    const p=new URLSearchParams(location.search);
    const live=p.get('live'); const nm=p.get('name');
    if(live){ room=live; name=nm||'Guest'; socket.emit('joinRoom',{code:live,name}); }
  })();

  // PLAY
  function startPlay(){
    applySettings();
    if(solo){
      layouts=[generateMaze(25,25)];
      players={ me:{name:'You',pos:{x:0,y:0},score:0} };
    }
    curLv=0; showLevel(curLv); resetPos();
    hide('choose','login','lobby','map'); show('play');
    if(!solo)socket.emit('joinRoom',{code:room,name});
    window.addEventListener('keydown',e=>keys[e.key]=true);
    window.addEventListener('keyup',  e=>keys[e.key]=false);
    if(settings.timer) startTimer(settings.timerDuration);
    requestAnimationFrame(playLoop);
  }
  socket.on('gameStarted',data=>{
    players=data.players; curLv=0; showLevel(curLv); resetPos();
    if(settings.timer) startTimer(settings.timerDuration);
  });
  socket.on('nextLevel',()=>{
    curLv++; showLevel(curLv); resetPos();
    if(settings.timer) startTimer(settings.timerDuration);
  });
  socket.on('levelComplete',()=>{/* confetti */});

  function showLevel(l){
    E.splash.innerText=`Level ${l+1}`;
    E.splash.style.animation='splashIn 1.2s ease-out';
    setTimeout(()=>E.splash.style.animation='',1200);
  }
  function resetPos(){ Object.values(players).forEach(p=>p.pos={x:0,y:0}); }

  // TIMER
  let tInt;
  function startTimer(sec){
    clearInterval(tInt); let t=sec;
    E.timerDisp.classList.remove('hidden'); E.timerDisp.innerText=`Time: ${t}s`;
    tInt=setInterval(()=>{
      t--; E.timerDisp.innerText=`Time: ${t}s`;
      if(t<=0){ clearInterval(tInt); E.timerDisp.innerText="Time's up!"; }
    },1000);
  }

  // FPS
  let lastF=performance.now(), fCnt=0;
  function updFPS(){
    const now=performance.now(); fCnt++;
    if(now-lastF>=1000){
      E.fpsCounter.innerText=`FPS: ${fCnt}`;
      fCnt=0; lastF=now;
    }
  }

  // PLAY LOOP
  function playLoop(){
    ctxPlay.clearRect(0,0,E.playC.width,E.playC.height);
    ctxPlay.fillStyle='crimson';
    layouts[curLv].forEach(w=>ctxPlay.fillRect(w.x*tile,w.y*tile,tile,tile));

    const meKey=solo?'me':socket.id; const me=players[meKey];
    if(me){
      if(keys['ArrowUp'])    me.pos.y-=speed;
      if(keys['ArrowDown'])  me.pos.y+=speed;
      if(keys['ArrowLeft'])  me.pos.x-=speed;
      if(keys['ArrowRight']) me.pos.x+=speed;
      if(!solo) socket.emit('playerMove',{code:room,pos:me.pos});
    }

    Object.values(players).forEach(p=>{
      ctxPlay.fillStyle=(p===me?'dodgerblue':'orange');
      ctxPlay.fillRect(p.pos.x*tile,p.pos.y*tile,tile*0.8,tile*0.8);
    });

    // hint arrow
    if(settings.hints && me){
      const ex=24*tile+tile/2, ey=24*tile+tile/2;
      const sx=me.pos.x*tile+tile/2, sy=me.pos.y*tile+tile/2;
      const ang=Math.atan2(ey-sy,ex-sx);
      ctxPlay.save();
      ctxPlay.translate(sx,sy); ctxPlay.rotate(ang);
      ctxPlay.beginPath();
      ctxPlay.moveTo(0,-tile/4); ctxPlay.lineTo(tile/2,0); ctxPlay.lineTo(0,tile/4);
      ctxPlay.fillStyle='#ffe100'; ctxPlay.fill();
      ctxPlay.restore();
    }

    if(settings.showFPS) updFPS();
    requestAnimationFrame(playLoop);
  }

  // MAP
  function startMap(){
    applySettings(); resetPos();
    hide('choose','login','lobby','play'); show('map');
    if(!solo) socket.emit('joinRoom',{code:room,name});
    requestAnimationFrame(mapLoop);
  }
  socket.on('playersUpdate',pls=>players=pls);
  socket.on('levelComplete',data=>{
    E.leaderboard.innerHTML='<h3>Final</h3>';
    data.leaderboard.forEach((p,i)=>{
      const d=document.createElement('div');
      d.innerText=`${i+1}. ${p.name}`;
      E.leaderboard.appendChild(d);
    });
  });
  function mapLoop(){
    ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height);
    ctxMap.fillStyle='crimson';
    layouts[curLv].forEach(w=>ctxMap.fillRect(w.x*tile,w.y*tile,tile,tile));
    ctxMap.fillStyle='#0f0';
    Object.values(players).forEach(p=>{
      ctxMap.beginPath();
      ctxMap.arc(p.pos.x*tile+tile/2,p.pos.y*tile+tile/2,tile/3,0,2*Math.PI);
      ctxMap.fill();
    });
    requestAnimationFrame(mapLoop);
  }

  // INITIALIZE
  applySettings();
});