// script.js
document.addEventListener('DOMContentLoaded', () => {
  // PeerJS + QRCode globals assumed loaded
  let peer = null;
  let conns = {};      // host: map of peerId→Connection
  let clientConn = null; // client: single Connection to host
  let isHost = false;
  let roomCode = '';
  let userName = '';
  let playerColor = '#00AAFF';
  let borderColor = '#222222';

  let players = {};   // peerId → { name, color, pos:{x,y}, score }
  let layouts = [];   // array of walls for each level
  let curLevel = 0;
  let maxLevels = 1;

  const TILE_COUNT = 25;
  const SPEED = 1;

  // Settings stored in localStorage
  const defaultSettings = {
    theme: 'light',
    borderColor: '#222222',
    audio: true
  };
  let settings = JSON.parse(
    localStorage.getItem('mzSettings') ||
    JSON.stringify(defaultSettings)
  );

  // UI elements
  const $ = s => document.querySelector(s);
  const screens = {
    choose: $('#choose'),
    create: $('#live-create'),
    join:   $('#live-join'),
    invalid:$('#invalid-qr'),
    lobby:  $('#lobby-screen'),
    play:   $('#play-screen'),
    map:    $('#map-screen')
  };
  const E = {
    // Choose
    btnSolo: $('#btn-solo'),
    btnLive: $('#btn-live'),
    // Create
    liveNameCreate: $('#live-name-create'),
    liveColorCreate:$('#live-color-create'),
    btnCreate:      $('#btn-create'),
    btnToJoin:      $('#btn-to-join'),
    errCreate:      $('#live-err-create'),
    // Join
    liveNameJoin:   $('#live-name-join'),
    liveColorJoin:  $('#live-color-join'),
    btnQRJoin:      $('#btn-qr-join'),
    joinCodeEntry:  $('#join-code-entry'),
    liveCode:       $('#live-code'),
    btnJoin:        $('#btn-join'),
    btnToCreate:    $('#btn-to-create'),
    errJoin:        $('#live-err-join'),
    invalid:        $('#invalid-qr'),
    invalidInput:   $('#invalid-code-input'),
    invalidJoinBtn: $('#invalid-join-btn'),
    // Lobby
    roomCode:       $('#room-code'),
    roomCodeCopy:   $('#room-code-copy'),
    qrCode:         $('#qr-code'),
    playersList:    $('#players-list'),
    viewMode:       $('#view-mode'),
    levelCount:     $('#level-count'),
    btnStart:       $('#btn-start'),
    // Settings
    btnSettings:    $('#btn-settings'),
    settingsModal:  $('#settingsModal'),
    settingTheme:   $('#setting-theme'),
    settingBorder:  $('#setting-border-color'),
    settingAudio:   $('#setting-audio'),
    settingsSave:   $('#settingsSave'),
    settingsCancel: $('#settingsCancel'),
    // Play/Map
    playC:          $('#playCanvas'),
    mapC:           $('#mapCanvas'),
    splash:         $('#levelSplash'),
    timerDisp:      $('#timerDisplay'),
    fpsCounter:     $('#fpsCounter'),
    leaderboard:    $('#leaderboard')
  };

  const ctxPlay = E.playC.getContext('2d');
  const ctxMap  = E.mapC.getContext('2d');

  // Utility show/hide
  function show(...keys) { keys.forEach(k => screens[k].classList.remove('hidden')); }
  function hide(...keys) { keys.forEach(k => screens[k].classList.add('hidden')); }
  function error(msg, where='create') {
    const el = where==='join' ? E.errJoin : E.errCreate;
    el.innerText = msg;
    setTimeout(() => el.innerText = '', 2000);
  }

  // Resize & compute offsets
  let TILE, offsetX, offsetY;
  function resize() {
    [E.playC, E.mapC].forEach(c => {
      c.width = innerWidth; c.height = innerHeight;
    });
    TILE = Math.min(innerWidth, innerHeight) / TILE_COUNT;
    const mazeSize = TILE * TILE_COUNT;
    offsetX = (innerWidth - mazeSize) / 2;
    offsetY = (innerHeight - mazeSize) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  // Settings
  function applySettings() {
    document.body.className = settings.theme;
    borderColor = settings.borderColor;
    E.btnSettings.style.display = isHost ? 'block' : 'none';
    E.settingTheme.value = settings.theme;
    E.settingBorder.value = settings.borderColor;
    E.settingAudio.checked = settings.audio;
  }
  function saveSettings() {
    settings.theme = E.settingTheme.value;
    settings.borderColor = E.settingBorder.value;
    settings.audio = E.settingAudio.checked;
    localStorage.setItem('mzSettings', JSON.stringify(settings));
    applySettings();
    E.settingsModal.classList.add('hidden');
  }
  E.btnSettings.addEventListener('click', () => E.settingsModal.classList.remove('hidden'));
  E.settingsCancel.addEventListener('click', () => E.settingsModal.classList.add('hidden'));
  E.settingsSave.addEventListener('click', saveSettings);

  // Maze generator (DFS)
  function generateMaze() {
    const grid = Array(TILE_COUNT).fill().map(() => Array(TILE_COUNT).fill(0));
    const vis  = JSON.parse(JSON.stringify(grid));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(arr) { arr.sort(() => Math.random() - .5); }
    function carve(x,y) {
      vis[x][y] = 1; grid[x][y] = 1;
      shuffle(dirs);
      dirs.forEach(([dx,dy]) => {
        const nx = x + dx*2, ny = y + dy*2;
        if (nx>=0 && nx<TILE_COUNT && ny>=0 && ny<TILE_COUNT && !vis[nx][ny]) {
          grid[x+dx][y+dy] = 1;
          carve(nx,ny);
        }
      });
    }
    carve(0,0);
    const walls = [];
    for (let i=0; i<TILE_COUNT; i++) {
      for (let j=0; j<TILE_COUNT; j++) {
        if (!grid[i][j]) walls.push({ x:j, y:i });
      }
    }
    return walls;
  }

  // P2P: create host peer
  function hostPeer(code) {
    peer = new Peer(code, { host: 'peerjs.com', secure: true, port: 443 });
    peer.on('open', () => {
      console.log('Host peer ID:', peer.id);
    });
    peer.on('connection', conn => {
      // new client joined
      conn.on('data', msg => handleMsg(conn, msg));
      conn.on('open', () => {
        // send current players list
        conn.send({ type:'players', players });
      });
      conns[conn.peer] = conn;
    });
  }

  // P2P: create client peer & connect to host
  function clientPeer(code) {
    peer = new Peer(null, { host: 'peerjs.com', secure: true, port: 443 });
    peer.on('open', id => {
      console.log('Client peer ID:', id);
      clientConn = peer.connect(code);
      clientConn.on('open', () => {
        clientConn.send({
          type: 'join',
          id,
          name: userName,
          color: playerColor
        });
      });
      clientConn.on('data', msg => handleMsg(clientConn, msg));
    });
  }

  // broadcast from host to all clients
  function broadcast(msg) {
    Object.values(conns).forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  }

  // message handler
  function handleMsg(conn, msg) {
    switch (msg.type) {
      case 'join':
        if (!isHost) return;
        // new client requests to join
        players[msg.id] = {
          name: msg.name,
          color: msg.color,
          pos: { x:0, y:0 },
          score: 0
        };
        renderLobby();
        broadcast({ type:'players', players });
        break;
      case 'players':
        // initial or updated list
        players = msg.players;
        renderLobby();
        break;
      case 'move':
        // update one player's position
        if (players[msg.id]) players[msg.id].pos = msg.pos;
        break;
      case 'startGame':
        // host told to start
        layouts = Array.from({ length: msg.maxLevels }, generateMaze);
        curLevel = 0;
        if (!isHost) startPlay();
        break;
      case 'nextLevel':
        curLevel++;
        if (!isHost) startPlay();
        break;
      case 'levelComplete':
        // show final leaderboard
        showMap(msg.leaderboard);
        break;
    }
  }

  // UI Renderers
  function renderLobby() {
    E.playersList.innerHTML = '';
    Object.values(players).forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="color:${p.color}">■</span> ${p.name}`;
      E.playersList.appendChild(li);
    });
  }

  // Maze Screens Flow
  function showLevelSplash(lv) {
    E.splash.innerText = `Level ${lv+1}`;
    E.splash.style.animation = 'splashIn 1.2s ease-out';
    setTimeout(() => E.splash.style.animation = '', 1200);
  }
  function resetPositions() {
    Object.values(players).forEach(p => p.pos = { x:0, y:0 });
  }

  // SINGLE TILE MOVEMENT
  function handleKey(e) {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    moveOne(e.key);
  }
  function moveOne(dir) {
    const pid = isHost ? peer.id : peer.id;
    const me = players[pid];
    if (!me) return;
    let nx = me.pos.x, ny = me.pos.y;
    if (dir === 'ArrowUp')    ny--;
    if (dir === 'ArrowDown')  ny++;
    if (dir === 'ArrowLeft')  nx--;
    if (dir === 'ArrowRight') nx++;
    if (nx<0||nx>=TILE_COUNT||ny<0||ny>=TILE_COUNT) return;
    // collide
    if (layouts[curLevel].some(w => w.x===nx && w.y===ny)) return;
    me.pos = { x:nx, y:ny };
    // broadcast move
    if (!isHost) clientConn.send({ type:'move', id: peer.id, pos: me.pos });
  }

  // DRAW PLAY CANVAS
  function playLoop() {
    ctxPlay.clearRect(0,0, E.playC.width, E.playC.height);
    const mw = TILE_COUNT*TILE, x0=offsetX, y0=offsetY;
    // border with exit gap
    ctxPlay.strokeStyle = borderColor; ctxPlay.lineWidth = 2;
    ctxPlay.beginPath();
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0+mw,y0);
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0,y0+mw);
    ctxPlay.moveTo(x0+mw,y0); ctxPlay.lineTo(x0+mw,y0+mw);
    const ex = x0+(TILE_COUNT-1)*TILE, ey=y0+mw;
    ctxPlay.moveTo(x0,ey); ctxPlay.lineTo(ex,ey);
    ctxPlay.moveTo(ex+TILE,ey); ctxPlay.lineTo(x0+mw,ey);
    ctxPlay.stroke();
    // walls
    ctxPlay.fillStyle = borderColor;
    layouts[curLevel].forEach(w => {
      ctxPlay.fillRect(x0+w.x*TILE, y0+w.y*TILE, TILE, TILE);
    });
    // start & exit
    ctxPlay.fillStyle='lime'; ctxPlay.fillRect(x0,y0,TILE,TILE);
    ctxPlay.fillStyle='gold'; ctxPlay.fillRect(ex,y0+(TILE_COUNT-1)*TILE,TILE,TILE);
    // players
    Object.values(players).forEach(p => {
      ctxPlay.fillStyle = p.color;
      ctxPlay.fillRect(
        x0 + p.pos.x*TILE,
        y0 + p.pos.y*TILE,
        TILE*0.8, TILE*0.8
      );
    });
    requestAnimationFrame(playLoop);
  }

  // DRAW MAP CANVAS
  function mapLoop() {
    ctxMap.clearRect(0,0, E.mapC.width, E.mapC.height);
    playLoop.call(); // redraw same border/walls
    // draw dots
    ctxMap.fillStyle = '#0f0';
    Object.values(players).forEach(p => {
      const px = offsetX + p.pos.x*TILE + TILE/2;
      const py = offsetY + p.pos.y*TILE + TILE/2;
      ctxMap.beginPath();
      ctxMap.arc(px, py, TILE/3, 0, 2*Math.PI);
      ctxMap.fill();
    });
    requestAnimationFrame(mapLoop);
  }

  // SOLO MODE
  function startPlay() {
    if (solo) {
      players = {};
      players['me'] = { name:'Solo', color:playerColor, pos:{x:0,y:0} };
      layouts = [ generateMaze() ];
    }
    curLevel = 0;
    showLevelSplash(curLevel);
    resetPositions();
    hide('choose','create','join','invalid','lobby','map');
    show('play');
    window.addEventListener('keydown', handleKey);
    requestAnimationFrame(playLoop);
  }

  // MAP MODE
  function startMap() {
    resetPositions();
    hide('choose','create','join','invalid','lobby','play');
    show('map');
    requestAnimationFrame(mapLoop);
  }

  // LOBBY RENDER
  function renderLobbyUI() {
    E.roomCode.innerText = roomCode;
    E.roomCodeCopy.innerText = roomCode;
    E.qrCode.innerHTML = '';
    new QRCode(E.qrCode, {
      text: `${location.origin}/maze/index.html?live=${roomCode}&name=${encodeURIComponent(userName)}&color=${playerColor}`,
      width: 128, height: 128
    });
    E.playersList.innerHTML = '';
    Object.values(players).forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="color:${p.color}">■</span> ${p.name}`;
      E.playersList.appendChild(li);
    });
  }

  // Create Room flow
  E.btnToJoin.addEventListener('click', () => {
    hide('create'); show('join');
  });
  E.btnCreate.addEventListener('click', () => {
    const n = E.liveNameCreate.value.trim();
    const c = E.liveColorCreate.value;
    if (!n) return error('Enter username','create');
    userName = n; playerColor = c;
    roomCode = Math.random().toString(36).substr(2,4).toUpperCase();
    isHost = true;
    players = {};
    players['host'] = { name:n, color:c, pos:{x:0,y:0} };
    hostPeer(roomCode);
    renderLobbyUI();
    hide('create','choose','join','invalid');
    show('lobby');
    applySettings();
  });

  // Join Room flow
  E.btnToCreate.addEventListener('click', () => {
    hide('join','invalid'); show('create');
  });
  E.btnQRJoin.addEventListener('click', () => {
    // rely on query params
  });
  E.invalidJoinBtn.addEventListener('click', () => {
    const code = E.invalidInput.value.trim().toUpperCase();
    const n    = E.liveNameJoin.value.trim();
    const c    = E.liveColorJoin.value;
    if (!n||!code) return error('All fields required','join');
    userName = n; playerColor = c; roomCode = code;
    clientPeer(roomCode);
    hide('join','invalid','choose'); show('lobby');
    renderLobbyUI();
  });
  E.btnJoin.addEventListener('click', () => {
    const code = E.liveCode.value.trim().toUpperCase();
    const n    = E.liveNameJoin.value.trim();
    const c    = E.liveColorJoin.value;
    if (!n||!code) return error('Both required','join');
    userName = n; playerColor = c; roomCode = code;
    clientPeer(roomCode);
    hide('join','choose','invalid'); show('lobby');
    renderLobbyUI();
    applySettings();
  });

  // Start Game (host only)
  E.btnStart.addEventListener('click', () => {
    if (!isHost) return;
    maxLevels = parseInt(E.levelCount.value) || 1;
    layouts = Array.from({length: maxLevels}, generateMaze);
    curLevel = 0;
    broadcast({ type:'startGame', maxLevels });
    hide('lobby');
    if (E.viewMode.value === 'play') startPlay();
    else startMap();
  });

  // Handle invalid QR (on join)
  // Check URL params
  (function checkQR() {
    const p = new URLSearchParams(location.search);
    const live = p.get('live'), nm = p.get('name'), col = p.get('color');
    if (live && nm && col) {
      userName = decodeURIComponent(nm);
      playerColor = col;
      roomCode = live.toUpperCase();
      clientPeer(roomCode);
      hide('choose','create','join','invalid');
      show('lobby');
      renderLobbyUI();
      applySettings();
    }
  })();

  // Initialize UI
  applySettings();
});