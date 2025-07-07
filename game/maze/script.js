// script.js

// --- SETUP & STATE ---
const socket    = io('/game/maze');
const qs        = s => document.querySelector(s);

let solo       = false;
let isHost     = false;
let roomCode   = '';
let userName   = '';
let maxLevels  = 1;
let currentLv  = 0;
let layouts    = [];       // array of mazes
let players    = {};       // id → { name, pos:{x,y}, score }
let keys       = {};       // pressed keys
const speed    = 1;        // movement per frame

// --- UI ELEMENTS ---
const screens = {
  choose:    qs('#choose'),
  login:     qs('#live-login'),
  lobby:     qs('#lobby-screen'),
  play:      qs('#play-screen'),
  map:       qs('#map-screen')
};
const elems = {
  btnSolo:     qs('#btn-solo'),
  btnLive:     qs('#btn-live'),
  btnCreate:   qs('#btn-create'),
  btnJoin:     qs('#btn-join'),
  btnStart:    qs('#btn-start'),
  nameIn:      qs('#live-name'),
  codeIn:      qs('#live-code'),
  errLive:     qs('#live-err'),
  playersList: qs('#players-list'),
  roomDisplay: qs('#room-code'),
  viewMode:    qs('#view-mode'),
  levelCount:  qs('#level-count'),
  shareLink:   qs('#share-link'),
  playCanvas:  qs('#playCanvas'),
  mapCanvas:   qs('#mapCanvas'),
  splash:      qs('#levelSplash'),
  leaderboard: qs('#leaderboard')
};
const ctxPlay = elems.playCanvas.getContext('2d');
const ctxMap  = elems.mapCanvas.getContext('2d');

// --- UTILS ---
function show(id){ screens[id].classList.remove('hidden'); }
function hide(...ids){ ids.forEach(i => screens[i].classList.add('hidden')); }
function error(msg){
  elems.errLive.innerText = msg;
  setTimeout(() => elems.errLive.innerText = '', 2000);
}

// Resize canvases and compute tile size
let tile;
function resize(){
  [elems.playCanvas, elems.mapCanvas].forEach(c => {
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
  });
  tile = Math.min(window.innerWidth, window.innerHeight) / 25;
}
window.addEventListener('resize', resize);
resize();

// --- MAZE GENERATOR (DFS) ---
function generateMaze(rows, cols) {
  const grid = Array(rows).fill().map(()=>Array(cols).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  function shuffle(arr){ arr.sort(()=>Math.random()-0.5); }
  function carve(r, c) {
    vis[r][c] = 1;
    grid[r][c] = 1;
    shuffle(dirs);
    dirs.forEach(([dr,dc]) => {
      const nr = r + dr*2, nc = c + dc*2;
      if (nr>=0 && nr<rows && nc>=0 && nc<cols && !vis[nr][nc]) {
        grid[r+dr][c+dc] = 1;
        carve(nr, nc);
      }
    });
  }
  carve(0, 0);
  // walls = cells still 0
  const walls = [];
  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      if (!grid[r][c]) walls.push({ x:c, y:r });
    }
  }
  return walls;
}

// --- SCREEN FLOW & EVENTS ---

// 1) Solo or Live choice
elems.btnSolo.addEventListener('click', () => {
  solo = true;
  startPlay();
});
elems.btnLive.addEventListener('click', () => {
  hide('choose'); show('login');
});

// 2) Live login: create or join
elems.btnCreate.addEventListener('click', () => {
  userName = elems.nameIn.value.trim();
  if (!userName) return error('Enter a username');
  socket.emit('createRoom', userName);
});
elems.btnJoin.addEventListener('click', () => {
  userName = elems.nameIn.value.trim();
  roomCode = elems.codeIn.value.trim().toUpperCase();
  if (!userName || !roomCode) return error('Name & code required');
  socket.emit('joinRoom', { code: roomCode, name: userName });
});

// 3) Lobby events
socket.on('roomJoined', data => {
  isHost    = true;
  roomCode  = data.code;
  players   = data.players;
  elems.roomDisplay.innerText = roomCode;
  renderPlayers();
  hide('login');
  show('lobby');

  // shareable link
  elems.shareLink.value = `${location.origin}/game/maze/index.html?live=${roomCode}&name=${userName}`;
});
socket.on('playersUpdate', pls => {
  players = pls;
  renderPlayers();
});
socket.on('hostChanged', id => {
  isHost = (id === socket.id);
  renderPlayers();
});

function renderPlayers(){
  elems.playersList.innerHTML = '';
  Object.entries(players).forEach(([id, p]) => {
    const li = document.createElement('li');
    li.innerText = p.name + (id===socket.id ? ' (you)' : '');
    if (isHost && id !== socket.id) {
      const btn = document.createElement('button');
      btn.innerText = 'Kick';
      btn.addEventListener('click', () => {
        socket.emit('kick', { code: roomCode, targetId: id });
      });
      li.appendChild(btn);
    }
    elems.playersList.appendChild(li);
  });
  // only host sees start & config
  elems.btnStart.style.display   = isHost ? 'inline-block' : 'none';
  elems.levelCount.style.display = isHost ? 'inline-block' : 'none';
  elems.viewMode.style.display   = isHost ? 'inline-block' : 'none';
}

// Host starts game
elems.btnStart.addEventListener('click', () => {
  if (!isHost) return;
  maxLevels = parseInt(elems.levelCount.value) || 1;
  // pre-generate all levels
  layouts = Array.from({length: maxLevels}, () => generateMaze(25,25));
  currentLv = 0;
  socket.emit('setView', { code:roomCode, viewMode: elems.viewMode.value });
  socket.emit('startGame', { code:roomCode, maxLevels });
  hide('lobby');
  if (elems.viewMode.value === 'play') startPlay();
  else                                   startMap();
});

// Direct-link join (index.html?live=CODE&name=NAME)
(function(){
  const params = new URLSearchParams(location.search);
  const live = params.get('live');
  const name = params.get('name');
  if (live) {
    roomCode = live;
    userName = name || 'Guest';
    socket.emit('joinRoom', { code:live, name:userName });
  }
})();

// --- PLAY MODE ---

function startPlay(){
  // if solo: generate one layout
  if (solo) {
    layouts = [ generateMaze(25,25) ];
    players = { me: { name:'You', pos:{x:0,y:0}, score:0 } };
  }
  currentLv = 0;
  displayLevelSplash(currentLv);
  hide('choose','login','lobby','map');
  show('play');
  resetPositions();
  if (!solo) socket.emit('joinRoom', { code:roomCode, name:userName });

  // keyboard
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup',   e => keys[e.key] = false);

  requestAnimationFrame(playLoop);
}

socket.on('gameStarted', data => {
  players   = data.players;
  currentLv = 0;
  displayLevelSplash(currentLv);
  resetPositions();
});
socket.on('nextLevel', () => {
  currentLv++;
  displayLevelSplash(currentLv);
  resetPositions();
});
socket.on('levelComplete', () => {
  // optional confetti or sound
});

// Level splash animation
function displayLevelSplash(lv){
  elems.splash.innerText = `Level ${lv+1}`;
  elems.splash.style.animation = 'splashIn 1.2s ease-out';
  setTimeout(() => {
    elems.splash.style.animation = '';
  }, 1200);
}

// Reset all player positions
function resetPositions(){
  Object.values(players).forEach(p => p.pos = { x:0, y:0 });
}

// Main play loop
function playLoop(){
  ctxPlay.clearRect(0,0,elems.playCanvas.width,elems.playCanvas.height);

  // draw walls
  ctxPlay.fillStyle = 'crimson';
  layouts[currentLv].forEach(w => {
    ctxPlay.fillRect(w.x*tile, w.y*tile, tile, tile);
  });

  // handle movement
  const meKey = solo ? 'me' : socket.id;
  const me    = players[meKey];
  if (me) {
    if (keys['ArrowUp'])    me.pos.y -= speed;
    if (keys['ArrowDown'])  me.pos.y += speed;
    if (keys['ArrowLeft'])  me.pos.x -= speed;
    if (keys['ArrowRight']) me.pos.x += speed;
    if (!solo) socket.emit('playerMove', { code:roomCode, pos:me.pos });
  }

  // draw players
  Object.values(players).forEach(p => {
    ctxPlay.fillStyle = (p === me) ? 'dodgerblue' : 'orange';
    ctxPlay.fillRect(p.pos.x*tile, p.pos.y*tile, tile*0.8, tile*0.8);
  });

  requestAnimationFrame(playLoop);
}

// --- MAP MODE ---

function startMap(){
  resetPositions();
  hide('choose','login','lobby','play');
  show('map');
  if (!solo) socket.emit('joinRoom', { code:roomCode, name:userName });
  requestAnimationFrame(mapLoop);
}

socket.on('playersUpdate', pls => {
  players = pls;
});
socket.on('levelComplete', data => {
  // show final leaderboard animation
  const lb = data.leaderboard;
  elems.leaderboard.innerHTML = '<h3>Final Standings</h3>';
  lb.forEach((p,i) => {
    const d = document.createElement('div');
    d.innerText = `${i+1}. ${p.name}`;
    d.style.animation = `slideIn 0.4s ease ${i*0.2}s forwards`;
    elems.leaderboard.appendChild(d);
  });
});

function mapLoop(){
  ctxMap.clearRect(0,0,elems.mapCanvas.width,elems.mapCanvas.height);

  // draw walls
  ctxMap.fillStyle = 'crimson';
  layouts[currentLv].forEach(w => {
    ctxMap.fillRect(w.x*tile, w.y*tile, tile, tile);
  });

  // draw players as dots
  ctxMap.fillStyle = '#0f0';
  Object.values(players).forEach(p => {
    ctxMap.beginPath();
    ctxMap.arc(
      p.pos.x*tile + tile/2,
      p.pos.y*tile + tile/2,
      tile/3, 0, 2*Math.PI
    );
    ctxMap.fill();
  });

  requestAnimationFrame(mapLoop);
}