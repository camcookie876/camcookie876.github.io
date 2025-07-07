// script.js
const socket    = io('/game/maze');
const qs        = s=>document.querySelector(s);
let solo=false, isHost=false, room='', name='';
let players={}, layouts=[], currentLevel=0, maxLevels=1;
let tile, keys={}, speed=1;

const screens = {
  choose:      qs('#choose'),
  liveLogin:   qs('#live-login'),
  lobby:       qs('#lobby-screen'),
  play:        qs('#play-screen'),
  map:         qs('#map-screen')
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
  roomCode:    qs('#room-code'),
  viewMode:    qs('#view-mode'),
  levelCount:  qs('#level-count'),
  shareLink:   qs('#share-link'),
  playC:       qs('#playCanvas'),
  mapC:        qs('#mapCanvas'),
  splash:      qs('#levelSplash'),
  lbDiv:       qs('#leaderboard')
};
const ctxPlay    = elems.playC.getContext('2d');
const ctxMap     = elems.mapC.getContext('2d');

// UTILS
function show(id){ screens[id].classList.remove('hidden'); }
function hide(...ids){ ids.forEach(i=>screens[i].classList.add('hidden')); }
function error(msg){ elems.errLive.innerText = msg; setTimeout(()=>elems.errLive.innerText='',2000); }
function resize(){
  [elems.playC,elems.mapC].forEach(c=>{
    c.width=innerWidth; c.height=innerHeight;
  });
  tile = Math.min(innerWidth,innerHeight)/25;
}
window.onresize=resize; resize();

// MAZE GENERATOR
function generateMaze(r,c){
  /* Classic DFS carve */
  const grid = Array(r).fill().map(()=>Array(c).fill(0));
  const vis  = JSON.parse(JSON.stringify(grid));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const shuffle=a=>a.sort(()=>0.5-Math.random());
  function dfs(x,y){
    vis[x][y]=true; grid[x][y]=1;
    shuffle(dirs).forEach(([dx,dy])=>{
      const nx=x+dx*2, ny=y+dy*2;
      if(nx>=0&&nx<r&&ny>=0&&ny<c&&!vis[nx][ny]){
        grid[x+dx][y+dy]=1; dfs(nx,ny);
      }
    });
  }
  dfs(0,0);
  const walls=[];
  for(let i=0;i<r;i++)for(let j=0;j<c;j++)
    if(!grid[i][j]) walls.push({x:j,y:i});
  return walls;
}

// SCREEN FLOW
elems.btnSolo.onclick = ()=>{
  solo=true; startPlay();
};
elems.btnLive.onclick = ()=>{
  hide('choose'); show('liveLogin');
};
elems.btnCreate.onclick = ()=>{
  name=elems.nameIn.value.trim();
  if(!name) return error('Enter username');
  socket.emit('createRoom',name);
};
elems.btnJoin.onclick = ()=>{
  name=elems.nameIn.value.trim();
  room=elems.codeIn.value.trim().toUpperCase();
  if(!name||!room) return error('both fields');
  socket.emit('joinRoom',{code:room,name});
};

// LOBBY EVENTS
socket.on('roomJoined', data=>{
  isHost=true; room=data.code; players=data.players;
  elems.roomCode.innerText=room; renderPlayers();
  hide('liveLogin'); show('lobby');
  // share link
  elems.shareLink.value = `${location.origin}/game/maze/index.html?live=${room}&name=${name}`;
});
socket.on('playersUpdate',pls=>{ players=pls; renderPlayers(); });
socket.on('hostChanged',id=>{ isHost=(id===socket.id); renderPlayers(); });

function renderPlayers(){
  elems.playersList.innerHTML='';
  Object.entries(players).forEach(([id,p])=>{
    const li=document.createElement('li');
    li.innerHTML = p.name + (id===socket.id?' (you)':'');
    if(isHost && id!==socket.id){
      const b=document.createElement('button');
      b.textContent='Kick'; b.onclick=()=>socket.emit('kick',{code:room,targetId:id});
      li.appendChild(b);
    }
    elems.playersList.appendChild(li);
  });
  elems.btnStart.style.display = isHost?'inline-block':'none';
  elems.levelCount.style.display = isHost?'inline-block':'none';
  elems.viewMode.style.display  = isHost?'inline-block':'none';
}

// START GAME
elems.btnStart.onclick = ()=>{
  if(!isHost) return;
  maxLevels = parseInt(elems.levelCount.value)||1;
  // pre-generate
  layouts = Array.from({length:maxLevels},()=>generateMaze(25,25));
  socket.emit('setView',{code:room,viewMode:elems.viewMode.value});
  socket.emit('startGame',{code:room,maxLevels});
  hide('lobby');
  elems.viewMode.value==='play' ? startPlay() : startMap();
};

// DIRECT LINK JOIN
(function(){
  const u=new URL(location.href);
  const live=u.searchParams.get('live');
  if(live){
    room=live; name=u.searchParams.get('name')||'Guest';
    socket.emit('joinRoom',{code:room,name});
  }
})();

// PLAY MODE
function startPlay(){
  layouts = layouts.length? layouts : [generateMaze(25,25)];
  players = solo? {me:{name:'You',pos:{x:0,y:0},score:0}} : players;
  currentLevel = 0; showLevelSplash();
  hide('choose','liveLogin','lobby','map'); show('play');
  if(!solo) socket.emit('joinRoom',{code:room,name});
  window.onkeydown=e=>keys[e.key]=true;
  window.onkeyup=  e=>keys[e.key]=false;
  requestAnimationFrame(playLoop);
}
socket.on('gameStarted', data=>{
  players = data.players;
  currentLevel = 0;
  showLevelSplash();
});
socket.on('nextLevel', ()=>{ currentLevel++; showLevelSplash(); resetPositions(); });
socket.on('levelComplete', ()=>{ /* can animate confetti here */ });

// SHOW LEVEL SPLASH
function showLevelSplash(){
  elems.splash.textContent = `Level ${currentLevel+1}`;
  elems.splash.style.animation = 'splashIn 1.2s ease-out';
  setTimeout(()=> elems.splash.style.animation = '',1200);
}

function resetPositions(){
  Object.values(players).forEach(p=>p.pos={x:0,y:0});
}

function playLoop(){
  ctxPlay.clearRect(0,0,elems.playC.width,elems.playC.height);
  // draw walls
  ctxPlay.fillStyle='crimson';
  layouts[currentLevel].forEach(o=>
    ctxPlay.fillRect(o.x*tile,o.y*tile,tile,tile)
  );
  // move & emit
  const me = solo? players.me : players[socket.id];
  if(me){
    if(keys['ArrowUp'])    me.pos.y-=speed;
    if(keys['ArrowDown'])  me.pos.y+=speed;
    if(keys['ArrowLeft'])  me.pos.x-=speed;
    if(keys['ArrowRight']) me.pos.x+=speed;
    if(!solo) socket.emit('playerMove',{code, pos:me.pos});
  }
  // draw players
  Object.values(players).forEach(p=>{
    ctxPlay.fillStyle = (p===me?'dodgerblue':'orange');
    ctxPlay.fillRect(p.pos.x*tile,p.pos.y*tile,tile*0.8,tile*0.8);
  });
  requestAnimationFrame(playLoop);
}

// MAP MODE
function startMap(){
  show('map'); hide('choose','liveLogin','lobby','play');
  if(!solo) socket.emit('joinRoom',{code:room,name});
  requestAnimationFrame(mapLoop);
}
socket.on('playersUpdate',pls=>players=pls);
socket.on('levelComplete', data=>{
  // final ranking animation
  const entries = data.leaderboard;
  elems.lbDiv.innerHTML = '<h3>Final Standings</h3>';
  entries.forEach((e,i)=>{
    const d=document.createElement('div');
    d.textContent=`${i+1}. ${e.name}`;
    d.style.animation = `slideIn .4s ease ${(i+1)*.2}s forwards`;
    elems.lbDiv.appendChild(d);
  });
});

function mapLoop(){
  ctxMap.clearRect(0,0,elems.mapC.width,elems.mapC.height);
  ctxMap.fillStyle='crimson';
  layouts[currentLevel].forEach(o=>
    ctxMap.fillRect(o.x*tile,o.y*tile,tile,tile)
  );
  ctxMap.fillStyle='#0f0';
  Object.values(players).forEach(p=>{
    ctxMap.beginPath();
    ctxMap.arc(p.pos.x*tile+tile/2,p.pos.y*tile+tile/2,tile/3,0,2*Math.PI);
    ctxMap.fill();
  });
  requestAnimationFrame(mapLoop);
}