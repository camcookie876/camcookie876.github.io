// script.js

const socket = io('/game/maze');
const qs = s => document.querySelector(s);
let roomCode, myName, isHost=false, soloMode=false, viewMode;

// UI Elements
const login      = qs('#login'),
      lobby      = qs('#lobby'),
      errP       = qs('#err'),
      nameIn     = qs('#name'),
      codeIn     = qs('#codeIn'),
      playersUl  = qs('#playersList'),
      roomCodeSp = qs('#roomCode'),
      shareLink  = qs('#shareLink'),
      qrDiv      = qs('#qr'),
      viewSelect = qs('#viewMode'),
      startBtn   = qs('#start'),
      playC      = qs('#playCanvas'),
      mapDiv     = qs('#mapContainer'),
      mapC       = qs('#mapCanvas'),
      lbDiv      = qs('#leaderboard'),
      ctxPlay    = playC.getContext('2d'),
      ctxMap     = mapC.getContext('2d');

// State
let players = {}, layout = [], level = 0;
let tile, speed = 4, keys = {};

// Helpers
function show(...els){ els.forEach(e=>e.classList.remove('hidden')); }
function hide(...els){ els.forEach(e=>e.classList.add('hidden')); }
function error(msg){ errP.innerText = msg; setTimeout(()=>errP.innerText='',3000); }

// Resize canvases
function resize() {
  playC.width = window.innerWidth; playC.height = window.innerHeight;
  mapC.width  = window.innerWidth; mapC.height  = window.innerHeight;
  tile = Math.min(window.innerWidth, window.innerHeight) / 25;
}
window.addEventListener('resize', resize);
resize();

// LOGIN ACTIONS
qs('#solo').onclick = ()=>{
  myName = nameIn.value.trim()||'Solo';
  soloMode = true;
  initPlay();
};

qs('#create').onclick = ()=>{
  myName = nameIn.value.trim();
  if(!myName) return error('Enter name');
  socket.emit('createRoom', myName);
};

qs('#join').onclick = ()=>{
  myName = nameIn.value.trim();
  roomCode = codeIn.value.trim().toUpperCase();
  if(!myName||!roomCode) return error('Name & code required');
  socket.emit('joinRoom', { code: roomCode, name: myName });
};

// SOCKET EVENTS: LOBBY
socket.on('error', m=> error(m));

socket.on('roomJoined', data=>{
  roomCode = data.code;
  isHost   = true;
  players  = data.players;
  login.classList.add('hidden');
  lobby.classList.remove('hidden');
  roomCodeSp.innerText = roomCode;
  renderPlayers();
  // shareable link & QR
  const link = `https://camcookie876.github.io/game/maze/index.html?live=${roomCode}`;
  shareLink.value = link;
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, { text: link, width:128, height:128 });
});

socket.on('playersUpdate', pls=>{
  players = pls;
  renderPlayers();
});

socket.on('hostChanged', id=>{
  isHost = id===socket.id;
  renderPlayers();
});

// HOST START
startBtn.onclick = ()=>{
  viewMode = viewSelect.value;
  socket.emit('setView',{ code:roomCode, viewMode });
  socket.emit('startGame', roomCode);
  lobby.classList.add('hidden');
  if(viewMode === 'play') initPlay();
  else initMap();
};

function renderPlayers(){
  playersUl.innerHTML = '';
  Object.entries(players).forEach(([id,p])=>{
    const li = document.createElement('li');
    li.innerText = p.name + (id===socket.id?' (you)':'');
    if(isHost && id!==socket.id){
      const b = document.createElement('button');
      b.innerText='Kick';
      b.onclick=()=>socket.emit('kick',{ code:roomCode, targetId:id });
      li.appendChild(b);
    }
    playersUl.appendChild(li);
  });
}

// ================= PLAY LOGIC =================

socket.on('gameStarted', data=>{
  layout = data.layout;
  level  = data.level;
  players  = data.players;
});

socket.on('nextLevel', data=>{
  layout = data.layout;
  level++;
  resetPositions();
});

socket.on('levelComplete', ({ winner, leaderboard })=>{
  alert(`${winner} won Level ${level+1}!`);
});

// join on direct link
(function checkQuery(){
  const url = new URL(location.href);
  const live = url.searchParams.get('live');
  const name = url.searchParams.get('name');
  if(live){
    roomCode = live;
    myName   = name || 'Guest';
    socket.emit('joinRoom',{ code:roomCode, name:myName });
  }
})();

function initPlay(){
  hide(login, lobby, mapDiv);
  show(playC);
  if(!soloMode) socket.emit('joinRoom',{ code:roomCode, name:myName });
  resetPositions();
  window.addEventListener('keydown', e=> keys[e.key]=true);
  window.addEventListener('keyup',   e=> keys[e.key]=false);
  requestAnimationFrame(playLoop);
}

function resetPositions(){
  Object.values(players).forEach(p=> p.pos = { x:0, y:0 });
}

function playLoop(){
  ctxPlay.clearRect(0,0,playC.width,playC.height);

  // draw obstacles
  ctxPlay.fillStyle='crimson';
  layout.forEach(o=>{
    ctxPlay.fillRect(
      o.x*tile, o.y*tile,
      o.w*tile, o.h*tile
    );
  });

  // move self
  const me = players[socket.id] || players[Object.keys(players)[0]];
  if(me){
    if(keys['ArrowUp'])    me.pos.y -= speed;
    if(keys['ArrowDown'])  me.pos.y += speed;
    if(keys['ArrowLeft'])  me.pos.x -= speed;
    if(keys['ArrowRight']) me.pos.x += speed;
    if(!soloMode) socket.emit('playerMove',{ code:roomCode, pos:me.pos });
  }

  // draw players
  Object.values(players).forEach(p=>{
    ctxPlay.fillStyle = p===me? 'dodgerblue':'orange';
    ctxPlay.fillRect(p.pos.x*tile, p.pos.y*tile, tile*0.8, tile*0.8);
  });

  requestAnimationFrame(playLoop);
}

// ================= MAP LOGIC =================

socket.on('gameStarted', data=>{
  layout = data.layout;
});

socket.on('playersUpdate', pls=>{
  players = pls;
});

socket.on('levelComplete', ({ leaderboard })=>{
  renderLeaderboard(leaderboard);
});

function initMap(){
  hide(login, lobby, playC);
  show(mapDiv);
  if(!soloMode) socket.emit('joinRoom',{ code:roomCode, name:myName });
  requestAnimationFrame(mapLoop);
}

function mapLoop(){
  ctxMap.clearRect(0,0,mapC.width,mapC.height);

  // draw layout
  ctxMap.fillStyle='crimson';
  layout.forEach(o=>{
    ctxMap.fillRect(
      o.x*tile, o.y*tile,
      o.w*tile, o.h*tile
    );
  });

  // draw all players as green dots
  ctxMap.fillStyle='#0f0';
  Object.values(players).forEach(p=>{
    ctxMap.beginPath();
    ctxMap.arc(
      p.pos.x*tile + tile/2,
      p.pos.y*tile + tile/2,
      tile/3,0,2*Math.PI
    );
    ctxMap.fill();
  });

  requestAnimationFrame(mapLoop);
}

function renderLeaderboard(board){
  lbDiv.innerHTML = '<h3>Leaderboard</h3>';
  board.forEach((e,i)=>{
    const d = document.createElement('div');
    d.innerText = `${i+1}. ${e.name}`;
    lbDiv.appendChild(d);
  });
}