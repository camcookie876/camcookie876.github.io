// script.js

// ——— SETUP ———
const socket = io({
  path: '/game/maze/socket.io'
});
const qs     = s => document.querySelector(s);

// ——— STATE ———
let solo=false, isHost=false, room='', userName='';
let maxLevels=1, currentLv=0, layouts=[], players={}, keys={};
const speed=1, defaultSettings = {
  theme:'light', audio:true, timer:false,
  timerDuration:60, showFPS:false, hints:true
};
let settings = JSON.parse(localStorage.getItem('mzSettings')|| JSON.stringify(defaultSettings));

// ——— UI ELEMENTS ———
const screens = {
  choose: qs('#choose'), login: qs('#live-login'),
  lobby: qs('#lobby-screen'), play: qs('#play-screen'),
  map: qs('#map-screen')
};
const E = {
  btnSolo: qs('#btn-solo'), btnLive: qs('#btn-live'),
  btnCreate: qs('#btn-create'), btnJoin: qs('#btn-join'),
  btnStart: qs('#btn-start'), nameIn: qs('#live-name'),
  codeIn: qs('#live-code'), errLive: qs('#live-err'),
  playersList: qs('#players-list'), roomDisplay: qs('#room-code'),
  viewMode: qs('#view-mode'), levelCount: qs('#level-count'),
  shareLink: qs('#share-link'), playC: qs('#playCanvas'),
  mapC: qs('#mapCanvas'), splash: qs('#levelSplash'),
  timerDisp: qs('#timerDisplay'), fpsCounter: qs('#fpsCounter'),
  btnSettings: qs('#btn-settings'), settingsModal: qs('#settingsModal'),
  settingTheme: qs('#setting-theme'), settingAudio: qs('#setting-audio'),
  settingTimer: qs('#setting-timer'), settingTimerDur: qs('#setting-timer-duration'),
  settingFPS: qs('#setting-show-fps'), settingHints: qs('#setting-hints'),
  settingsSave: qs('#settingsSave'), settingsCancel: qs('#settingsCancel'),
  leaderboard: qs('#leaderboard')
};
const ctxPlay = E.playC.getContext('2d'), ctxMap = E.mapC.getContext('2d');

// ——— UTILS ———
function show(id){ screens[id].classList.remove('hidden'); }
function hide(...ids){ ids.forEach(i=>screens[i].classList.add('hidden')); }
function error(msg){ E.errLive.innerText=msg; setTimeout(()=>E.errLive.innerText='',2000); }

// Apply & save settings
function applySettings(){
  document.body.className = settings.theme;
  E.timerDisp.classList.toggle('hidden', !settings.timer);
  E.fpsCounter.classList.toggle('hidden', !settings.showFPS);
  E.btnSettings.classList.remove('hidden');
  // Prefill modal
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
  localStorage.setItem('mzSettings', JSON.stringify(settings));
  applySettings();
}

// Canvas resize
let tile;
function resize(){
  [E.playC,E.mapC].forEach(c=>{
    c.width=window.innerWidth;
    c.height=window.innerHeight;
  });
  tile = Math.min(window.innerWidth,window.innerHeight)/25;
}
window.onresize = resize; resize();

// ——— MAZE GENERATOR ———
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

// ——— SETTINGS MODAL ———
E.btnSettings.onclick = ()=> E.settingsModal.classList.remove('hidden');
E.settingsCancel.onclick = ()=> E.settingsModal.classList.add('hidden');
E.settingsSave.onclick = ()=>{
  saveSettings();
  E.settingsModal.classList.add('hidden');
};

// ——— FLOW ———
// 1) Solo or Live
E.btnSolo.onclick = ()=>{ solo=true; startPlay(); };
E.btnLive.onclick = ()=>{ hide('choose'); show('login'); };

// 2) Live login
E.btnCreate.onclick = ()=>{
  userName = E.nameIn.value.trim();
  if(!userName) return error('Enter a username');
  socket.emit('createRoom', userName);
};
E.btnJoin.onclick = ()=>{
  userName = E.nameIn.value.trim();
  room = E.codeIn.value.trim().toUpperCase();
  if(!userName||!room) return error('Both fields required');
  socket.emit('joinRoom',{code:room,name:userName});
};

// Lobby events
socket.on('roomJoined', data=>{
  isHost=true; room=data.code; players=data.players;
  E.roomDisplay.innerText=room; renderPlayers();
  hide('login'); show('lobby');
  E.shareLink.value=`https://camcookie876.github.io/game/maze/index.html?live=${room}&name=${userName}`;
});
socket.on('playersUpdate', pls=>{ players=pls; renderPlayers(); });
socket.on('hostChanged', id=>{ isHost=(id===socket.id); renderPlayers(); });

function renderPlayers(){
  E.playersList.innerHTML='';
  Object.entries(players).forEach(([id,p])=>{
    const li=document.createElement('li');
    li.innerText=p.name+(id===socket.id?' (you)':'');
    if(isHost && id!==socket.id){
      const b=document.createElement('button');
      b.innerText='Kick';
      b.onclick=()=>socket.emit('kick',{code:room,targetId:id});
      li.appendChild(b);
    }
    E.playersList.appendChild(li);
  });
  E.btnStart.style.display   = isHost?'inline-block':'none';
  E.levelCount.style.display = isHost?'inline-block':'none';
  E.viewMode.style.display   = isHost?'inline-block':'none';
}

// Start game
E.btnStart.onclick = ()=>{
  if(!isHost) return;
  maxLevels = parseInt(E.levelCount.value)||1;
  layouts = Array.from({length:maxLevels}, ()=>generateMaze(25,25));
  currentLv=0;
  socket.emit('setView',{code:room,viewMode:E.viewMode.value});
  socket.emit('startGame',{code:room,maxLevels});
  hide('lobby');
  E.viewMode.value==='play'? startPlay() : startMap();
};

// Direct-link join
(function(){
  const p=new URLSearchParams(location.search);
  const live=p.get('live');
  if(live){
    room=live; userName=p.get('name')||'Guest';
    socket.emit('joinRoom',{code:live,name:userName});
  }
})();

/* ========== PLAY MODE ========== */
function startPlay(){
  applySettings();
  if(solo){
    layouts=[generateMaze(25,25)];
    players={ me:{name:'You',pos:{x:0,y:0},score:0} };
  }
  currentLv=0; displayLevelSplash(currentLv);
  hide('choose','login','lobby','map'); show('play');
  resetPositions();
  if(!solo) socket.emit('joinRoom',{code:room,name:userName});
  window.onkeydown=e=>keys[e.key]=true;
  window.onkeyup=  e=>keys[e.key]=false;
  if(settings.timer) startTimer(settings.timerDuration);
  requestAnimationFrame(playLoop);
}

socket.on('gameStarted', data=>{
  players=data.players; currentLv=0;
  displayLevelSplash(currentLv); resetPositions();
  if(settings.timer) startTimer(settings.timerDuration);
});
socket.on('nextLevel', ()=>{
  currentLv++; displayLevelSplash(currentLv);
  resetPositions();
  if(settings.timer) startTimer(settings.timerDuration);
});
socket.on('levelComplete', ()=>{ /* confetti or sound */ });

function displayLevelSplash(lv){
  E.splash.innerText=`Level ${lv+1}`;
  E.splash.style.animation='splashIn 1.2s ease-out';
  setTimeout(()=>E.splash.style.animation='',1200);
}
function resetPositions(){ Object.values(players).forEach(p=>p.pos={x:0,y:0}); }

// Timer
let timerInterval;
function startTimer(sec){
  clearInterval(timerInterval);
  let t=sec;
  E.timerDisp.classList.remove('hidden');
  E.timerDisp.innerText=`Time: ${t}s`;
  timerInterval = setInterval(()=>{
    t--; E.timerDisp.innerText=`Time: ${t}s`;
    if(t<=0){ clearInterval(timerInterval); E.timerDisp.innerText="Time's up!"; }
  },1000);
}

// FPS Counter
let lastFrame=performance.now(), frames=0;
function updateFPS(){
  const now=performance.now();
  frames++;
  if(now-lastFrame>=1000){
    E.fpsCounter.innerText=`FPS: ${frames}`;
    frames=0; lastFrame=now;
  }
}

// Main loop
function playLoop(){
  ctxPlay.clearRect(0,0,E.playC.width,E.playC.height);
  ctxPlay.fillStyle='crimson';
  layouts[currentLv].forEach(w=>{
    ctxPlay.fillRect(w.x*tile,w.y*tile,tile,tile);
  });
  const meKey=solo?'me':socket.id, me=players[meKey];
  if(me){
    if(keys['ArrowUp']) me.pos.y-=speed;
    if(keys['ArrowDown']) me.pos.y+=speed;
    if(keys['ArrowLeft']) me.pos.x-=speed;
    if(keys['ArrowRight'])me.pos.x+=speed;
    if(!solo) socket.emit('playerMove',{code:room,pos:me.pos});
  }
  Object.values(players).forEach(p=>{
    ctxPlay.fillStyle=(p===me?'dodgerblue':'orange');
    ctxPlay.fillRect(p.pos.x*tile,p.pos.y*tile,tile*0.8,tile*0.8);
  });
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
  if(settings.showFPS) updateFPS();
  requestAnimationFrame(playLoop);
}

/* ============ MAP MODE ============ */
function startMap(){
  applySettings(); resetPositions();
  hide('choose','login','lobby','play'); show('map');
  if(!solo) socket.emit('joinRoom',{code:room,name:userName});
  requestAnimationFrame(mapLoop);
}
socket.on('playersUpdate', pls=>players=pls);
socket.on('levelComplete', data=>{
  E.leaderboard.innerHTML='<h3>Final Standings</h3>';
  data.leaderboard.forEach((p,i)=>{
    const d=document.createElement('div');
    d.textContent=`${i+1}. ${p.name}`; E.leaderboard.appendChild(d);
  });
});
function mapLoop(){
  ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height);
  ctxMap.fillStyle='crimson';
  layouts[currentLv].forEach(w=>{
    ctxMap.fillRect(w.x*tile,w.y*tile,tile,tile);
  });
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