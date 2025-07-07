// script.js

/* ================= SETUP & STATE ================ */
const socket   = io('/game/maze');
const qs       = s=>document.querySelector(s);

let solo        = false;
let isHost      = false;
let roomCode    = '';
let userName    = '';
let maxLevels   = 1;
let currentLv   = 0;
let layouts     = [];  // array of wall arrays
let players     = {};
let keys        = {};
const speed     = 1;

// Preferences & Defaults
const defaultSettings = {
  theme: 'light',
  audio: true,
  timer: false,
  timerDuration: 60,
  showFPS: false,
  hints: true
};
let settings = JSON.parse(localStorage.getItem('mzSettings') || JSON.stringify(defaultSettings));

/* =============== UI ELEMENTS ================== */
const screens = {
  choose:    qs('#choose'),
  login:     qs('#live-login'),
  lobby:     qs('#lobby-screen'),
  play:      qs('#play-screen'),
  map:       qs('#map-screen')
};
const elems = {
  btnSolo:   qs('#btn-solo'),
  btnLive:   qs('#btn-live'),
  btnCreate: qs('#btn-create'),
  btnJoin:   qs('#btn-join'),
  btnStart:  qs('#btn-start'),
  nameIn:    qs('#live-name'),
  codeIn:    qs('#live-code'),
  errLive:   qs('#live-err'),
  playersList: qs('#players-list'),
  roomDisplay: qs('#room-code'),
  viewMode:    qs('#view-mode'),
  levelCount:  qs('#level-count'),
  shareLink:   qs('#share-link'),
  playC:        qs('#playCanvas'),
  mapC:         qs('#mapCanvas'),
  splash:       qs('#levelSplash'),
  timerDisp:    qs('#timerDisplay'),
  fpsCounter:   qs('#fpsCounter'),
  btnSettings:  qs('#btn-settings'),
  settingsModal: qs('#settingsModal'),
  // modal fields
  settingTheme: qs('#setting-theme'),
  settingAudio: qs('#setting-audio'),
  settingTimer: qs('#setting-timer'),
  settingTimerDur: qs('#setting-timer-duration'),
  settingFPS:    qs('#setting-show-fps'),
  settingHints:  qs('#setting-hints'),
  settingsSave:  qs('#settingsSave'),
  settingsCancel: qs('#settingsCancel'),
  leaderboard: qs('#leaderboard')
};
const ctxPlay = elems.playC.getContext('2d');
const ctxMap  = elems.mapC.getContext('2d');

/* =============== UTILS ======================= */
function show(id){ screens[id].classList.remove('hidden'); }
function hide(...ids){ ids.forEach(i=>screens[i].classList.add('hidden')); }
function error(msg){
  elems.errLive.innerText = msg;
  setTimeout(()=>elems.errLive.innerText='',2000);
}

// Apply preferences
function applySettings(){
  // theme
  document.body.className = settings.theme;
  // audio on/off handled in code
  // timer
  if (settings.timer) elems.timerDisp.classList.remove('hidden');
  else elems.timerDisp.classList.add('hidden');
  // fps
  if (settings.showFPS) elems.fpsCounter.classList.remove('hidden');
  else elems.fpsCounter.classList.add('hidden');
  // hints
  // leftover: used in playLoop
  // update modal inputs
  elems.settingTheme.value = settings.theme;
  elems.settingAudio.checked = settings.audio;
  elems.settingTimer.checked = settings.timer;
  elems.settingTimerDur.value = settings.timerDuration;
  elems.settingFPS.checked = settings.showFPS;
  elems.settingHints.checked = settings.hints;
  // show Settings button once we're past login
  elems.btnSettings.classList.remove('hidden');
}

// Save preferences
function saveSettings(){
  settings.theme = elems.settingTheme.value;
  settings.audio = elems.settingAudio.checked;
  settings.timer = elems.settingTimer.checked;
  settings.timerDuration = parseInt(elems.settingTimerDur.value)||60;
  settings.showFPS = elems.settingFPS.checked;
  settings.hints = elems.settingHints.checked;
  localStorage.setItem('mzSettings', JSON.stringify(settings));
  applySettings();
}

// Canvas resize
let tile;
function resize(){
  [elems.playC, elems.mapC].forEach(c=>{
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  });
  tile = Math.min(window.innerWidth, window.innerHeight) / 25;
}
window.addEventListener('resize', resize);
resize();

/* ============ MAZE GENERATOR =============== */
function generateMaze(r,c){
  const grid = Array(r).fill().map(()=>Array(c).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(a){ a.sort(()=>Math.random()-.5); }
  function carve(x,y){
    vis[x][y]=1; grid[x][y]=1;
    shuffle(dirs);
    dirs.forEach(([dx,dy])=>{
      const nx = x+dx*2, ny = y+dy*2;
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

/* =========== SETTINGS MODAL =============== */
elems.btnSettings.addEventListener('click', ()=>{
  elems.settingsModal.classList.remove('hidden');
});
elems.settingsCancel.addEventListener('click', ()=>{
  elems.settingsModal.classList.add('hidden');
});
elems.settingsSave.addEventListener('click', ()=>{
  saveSettings();
  elems.settingsModal.classList.add('hidden');
});

/* =========== SCREEN FLOW ================= */

// 1) Choice
elems.btnSolo.onclick = ()=>{ solo=true; startPlay(); };
elems.btnLive.onclick = ()=>{ hide('choose'); show('login'); };

// 2) Live login
elems.btnCreate.onclick = ()=>{
  userName = elems.nameIn.value.trim();
  if(!userName) return error('Enter username');
  socket.emit('createRoom', userName);
};
elems.btnJoin.onclick = ()=>{
  userName = elems.nameIn.value.trim();
  roomCode = elems.codeIn.value.trim().toUpperCase();
  if(!userName||!roomCode) return error('Both fields required');
  socket.emit('joinRoom',{ code:roomCode, name:userName });
};

// Lobby events
socket.on('roomJoined', data=>{
  isHost = true;
  roomCode = data.code;
  players = data.players;
  elems.roomDisplay.innerText = roomCode;
  renderPlayers();
  hide('login'); show('lobby');
  elems.shareLink.value = `${location.origin}/game/maze/index.html?live=${roomCode}&name=${userName}`;
});
socket.on('playersUpdate', pls=>{ players=pls; renderPlayers(); });
socket.on('hostChanged', id=>{ isHost=(id===socket.id); renderPlayers(); });

function renderPlayers(){
  elems.playersList.innerHTML = '';
  Object.entries(players).forEach(([id,p])=>{
    const li=document.createElement('li');
    li.innerText = p.name + (id===socket.id?' (you)':'');
    if(isHost && id!==socket.id){
      const b=document.createElement('button');
      b.innerText='Kick';
      b.onclick=()=>socket.emit('kick',{code:roomCode,targetId:id});
      li.appendChild(b);
    }
    elems.playersList.appendChild(li);
  });
  elems.btnStart.style.display   = isHost?'inline-block':'none';
  elems.levelCount.style.display = isHost?'inline-block':'none';
  elems.viewMode.style.display   = isHost?'inline-block':'none';
}

// Start game
elems.btnStart.onclick = ()=>{
  if(!isHost) return;
  maxLevels = parseInt(elems.levelCount.value)||1;
  layouts = Array.from({length:maxLevels}, ()=>generateMaze(25,25));
  currentLv=0;
  socket.emit('setView',{code:roomCode,viewMode:elems.viewMode.value});
  socket.emit('startGame',{code:roomCode,maxLevels});
  hide('lobby');
  elems.viewMode.value==='play'? startPlay() : startMap();
};

// Direct link join
(function(){
  const p=new URLSearchParams(location.search);
  const live=p.get('live');
  if(live){
    roomCode=live;
    userName=p.get('name')||'Guest';
    socket.emit('joinRoom',{code:live,name:userName});
  }
})();

/* ============ PLAY MODE ================== */
function startPlay(){
  applySettings();
  if(solo){
    layouts=[ generateMaze(25,25) ];
    players={ me:{name:'You',pos:{x:0,y:0},score:0} };
  }
  currentLv=0; displayLevelSplash(currentLv);
  hide('choose','login','lobby','map'); show('play');
  resetPositions();
  if(!solo) socket.emit('joinRoom',{code:roomCode,name:userName});
  window.onkeydown=e=>keys[e.key]=true;
  window.onkeyup=  e=>keys[e.key]=false;
  if(settings.timer) startTimer(settings.timerDuration);
  requestAnimationFrame(playLoop);
}

socket.on('gameStarted', data=>{
  players=data.players;
  currentLv=0;
  displayLevelSplash(currentLv);
  resetPositions();
  if(settings.timer) startTimer(settings.timerDuration);
});
socket.on('nextLevel', ()=>{
  currentLv++;
  displayLevelSplash(currentLv);
  resetPositions();
  if(settings.timer) startTimer(settings.timerDuration);
});
socket.on('levelComplete', ()=>{ /* audio or confetti here */ });

function displayLevelSplash(lv){
  elems.splash.innerText = `Level ${lv+1}`;
  elems.splash.style.animation = 'splashIn 1.2s ease-out';
  setTimeout(()=> elems.splash.style.animation = '',1200);
}

function resetPositions(){
  Object.values(players).forEach(p=>p.pos={x:0,y:0});
}

// Timer logic
let timerInterval;
function startTimer(sec){
  clearInterval(timerInterval);
  let t = sec;
  elems.timerDisp.classList.remove('hidden');
  elems.timerDisp.innerText = `Time: ${t}s`;
  timerInterval = setInterval(()=>{
    t--;
    elems.timerDisp.innerText = `Time: ${t}s`;
    if(t<=0){
      clearInterval(timerInterval);
      elems.timerDisp.innerText = `Time's up!`;
      // Could end level or penalize
    }
  },1000);
}

// FPS Counter
let lastFrame=performance.now(), frames=0;
function updateFPS(){
  const now = performance.now();
  frames++;
  if(now - lastFrame >= 1000){
    elems.fpsCounter.innerText = `FPS: ${frames}`;
    frames = 0;
    lastFrame = now;
  }
}

// Main play loop
function playLoop(){
  ctxPlay.clearRect(0,0,elems.playC.width,elems.playC.height);

  // walls
  ctxPlay.fillStyle='crimson';
  layouts[currentLv].forEach(w=>{
    ctxPlay.fillRect(w.x*tile,w.y*tile,tile,tile);
  });

  // move
  const meKey = solo?'me':socket.id;
  const me    = players[meKey];
  if(me){
    if(keys['ArrowUp'])    me.pos.y-=speed;
    if(keys['ArrowDown'])  me.pos.y+=speed;
    if(keys['ArrowLeft'])  me.pos.x-=speed;
    if(keys['ArrowRight']) me.pos.x+=speed;
    if(!solo) socket.emit('playerMove',{code:roomCode,pos:me.pos});
  }

  // player dots
  Object.values(players).forEach(p=>{
    ctxPlay.fillStyle=(p===me?'dodgerblue':'orange');
    ctxPlay.fillRect(p.pos.x*tile,p.pos.y*tile,tile*0.8,tile*0.8);
  });

  // mini-map hints arrow
  if(settings.hints && me){
    const ex = 24*tile + tile/2, ey = 24*tile + tile/2;
    const sx = me.pos.x*tile + tile/2, sy = me.pos.y*tile + tile/2;
    const ang = Math.atan2(ey-sy, ex-sx);
    ctxPlay.save();
    ctxPlay.translate(sx, sy);
    ctxPlay.rotate(ang);
    ctxPlay.beginPath();
    ctxPlay.moveTo(0, -tile/4);
    ctxPlay.lineTo(tile/2, 0);
    ctxPlay.lineTo(0, tile/4);
    ctxPlay.fillStyle = '#ffe100';
    ctxPlay.fill();
    ctxPlay.restore();
  }

  if(settings.showFPS) updateFPS();
  requestAnimationFrame(playLoop);
}

/* ============ MAP MODE =================== */
function startMap(){
  applySettings();
  resetPositions();
  hide('choose','login','lobby','play'); show('map');
  if(!solo) socket.emit('joinRoom',{code:roomCode,name:userName});
  requestAnimationFrame(mapLoop);
}

socket.on('playersUpdate', pls=>players=pls);
socket.on('levelComplete', data=>{
  const lb = data.leaderboard;
  elems.leaderboard.innerHTML = '<h3>Final Standings</h3>';
  lb.forEach((p,i)=>{
    const d=document.createElement('div');
    d.innerText=`${i+1}. ${p.name}`;
    elems.leaderboard.appendChild(d);
  });
});

function mapLoop(){
  ctxMap.clearRect(0,0,elems.mapC.width,elems.mapC.height);
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