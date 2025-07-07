// script.js

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', () => {

  // ——— GLOBAL STATE ———
  let solo = false;
  let isHost = false;
  let roomCode = '';
  let userName = '';
  let maxLevels = 1;
  let currentLv = 0;
  let layouts = [];
  let players = {};
  let keys = {};
  const speed = 1;

  // Default settings
  const defaultSettings = {
    theme: 'light',
    audio: true,
    timer: false,
    timerDuration: 60,
    showFPS: false,
    hints: true
  };
  let settings = JSON.parse(localStorage.getItem('mzSettings') || JSON.stringify(defaultSettings));

  // ——— ELEMENTS ———
  const $ = s => document.querySelector(s);
  const screens = {
    choose: $('#choose'),
    login: $('#live-login'),
    lobby: $('#lobby-screen'),
    play: $('#play-screen'),
    map: $('#map-screen')
  };
  const elems = {
    btnSolo:      $('#btn-solo'),
    btnLive:      $('#btn-live'),
    btnCreate:    $('#btn-create'),
    btnJoin:      $('#btn-join'),
    btnStart:     $('#btn-start'),
    nameIn:       $('#live-name'),
    codeIn:       $('#live-code'),
    errLive:      $('#live-err'),
    playersList:  $('#players-list'),
    roomDisplay:  $('#room-code'),
    viewMode:     $('#view-mode'),
    levelCount:   $('#level-count'),
    shareLink:    $('#share-link'),
    btnSettings:  $('#btn-settings'),
    settingsModal:$('#settingsModal'),
    settingTheme: $('#setting-theme'),
    settingAudio: $('#setting-audio'),
    settingTimer: $('#setting-timer'),
    settingTimerDur: $('#setting-timer-duration'),
    settingFPS:    $('#setting-show-fps'),
    settingHints:  $('#setting-hints'),
    settingsSave:  $('#settingsSave'),
    settingsCancel:$('#settingsCancel'),
    playCanvas:   $('#playCanvas'),
    mapCanvas:    $('#mapCanvas'),
    splash:       $('#levelSplash'),
    timerDisp:    $('#timerDisplay'),
    fpsCounter:   $('#fpsCounter'),
    leaderboard:  $('#leaderboard')
  };
  const ctxPlay = elems.playCanvas.getContext('2d');
  const ctxMap  = elems.mapCanvas.getContext('2d');

  // Socket.IO client
  const socket = io('/game/maze');

  // ——— UTILS ———
  function show(...ids) {
    ids.forEach(id => screens[id].classList.remove('hidden'));
  }
  function hide(...ids) {
    ids.forEach(id => screens[id].classList.add('hidden'));
  }
  function error(msg) {
    elems.errLive.innerText = msg;
    setTimeout(() => elems.errLive.innerText = '', 2000);
  }

  // Resize and compute tile
  let tile;
  function resize() {
    [elems.playCanvas, elems.mapCanvas].forEach(c => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    });
    tile = Math.min(window.innerWidth, window.innerHeight) / 25;
  }
  window.addEventListener('resize', resize);
  resize();

  // ——— SETTINGS ———
  function applySettings() {
    document.body.className = settings.theme;
    elems.timerDisp.classList.toggle('hidden', !settings.timer);
    elems.fpsCounter.classList.toggle('hidden', !settings.showFPS);
    elems.btnSettings.classList.remove('hidden');
    // Prefill modal
    elems.settingTheme.value = settings.theme;
    elems.settingAudio.checked = settings.audio;
    elems.settingTimer.checked = settings.timer;
    elems.settingTimerDur.value = settings.timerDuration;
    elems.settingFPS.checked = settings.showFPS;
    elems.settingHints.checked = settings.hints;
  }
  function saveSettings() {
    settings.theme = elems.settingTheme.value;
    settings.audio = elems.settingAudio.checked;
    settings.timer = elems.settingTimer.checked;
    settings.timerDuration = parseInt(elems.settingTimerDur.value) || 60;
    settings.showFPS = elems.settingFPS.checked;
    settings.hints = elems.settingHints.checked;
    localStorage.setItem('mzSettings', JSON.stringify(settings));
    applySettings();
  }
  elems.btnSettings.addEventListener('click', () => elems.settingsModal.classList.remove('hidden'));
  elems.settingsCancel.addEventListener('click', () => elems.settingsModal.classList.add('hidden'));
  elems.settingsSave.addEventListener('click', () => {
    saveSettings();
    elems.settingsModal.classList.add('hidden');
  });

  // ——— MAZE GENERATOR ———
  function generateMaze(r, c) {
    const grid = Array(r).fill().map(() => Array(c).fill(0));
    const vis  = JSON.parse(JSON.stringify(grid));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }
    function carve(x, y) {
      vis[x][y] = 1; grid[x][y] = 1;
      shuffle(dirs);
      dirs.forEach(([dx, dy]) => {
        const nx = x + dx*2, ny = y + dy*2;
        if (nx>=0&&nx<r&&ny>=0&&ny<c && !vis[nx][ny]) {
          grid[x+dx][y+dy] = 1;
          carve(nx, ny);
        }
      });
    }
    carve(0,0);
    const walls = [];
    for (let i=0;i<r;i++) for (let j=0;j<c;j++) {
      if (!grid[i][j]) walls.push({ x:j, y:i });
    }
    return walls;
  }

  // ——— FLOW: CHOOSE SOLO / LIVE ———
  elems.btnSolo.addEventListener('click', () => {
    solo = true;
    startPlay();
  });
  elems.btnLive.addEventListener('click', () => {
    hide('choose');
    show('login');
  });

  // ——— LIVE LOGIN ———
  elems.btnCreate.addEventListener('click', () => {
    userName = elems.nameIn.value.trim();
    if (!userName) return error('Enter username');
    socket.emit('createRoom', userName);
  });
  elems.btnJoin.addEventListener('click', () => {
    userName = elems.nameIn.value.trim();
    roomCode = elems.codeIn.value.trim().toUpperCase();
    if (!userName || !roomCode) return error('Name & code required');
    socket.emit('joinRoom', { code: roomCode, name: userName });
  });

  // ——— LOBBY EVENTS ———
  socket.on('roomJoined', data => {
    isHost = true;
    roomCode = data.code;
    players = data.players;
    elems.roomDisplay.innerText = roomCode;
    renderPlayers();
    hide('login');
    show('lobby');
    elems.shareLink.value =
      `https://camcookie876.github.io/game/maze/index.html?live=${roomCode}&name=${userName}`;
  });
  socket.on('playersUpdate', pls => {
    players = pls;
    renderPlayers();
  });
  socket.on('hostChanged', id => {
    isHost = (id === socket.id);
    renderPlayers();
  });

  function renderPlayers() {
    elems.playersList.innerHTML = '';
    Object.entries(players).forEach(([id, p]) => {
      const li = document.createElement('li');
      li.innerText = p.name + (id === socket.id ? ' (you)' : '');
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
    elems.btnStart.style.display   = isHost ? 'inline-block' : 'none';
    elems.levelCount.style.display = isHost ? 'inline-block' : 'none';
    elems.viewMode.style.display   = isHost ? 'inline-block' : 'none';
  }

  // Host starts game
  elems.btnStart.addEventListener('click', () => {
    if (!isHost) return;
    maxLevels = parseInt(elems.levelCount.value) || 1;
    layouts   = Array.from({ length: maxLevels }, () => generateMaze(25,25));
    currentLv = 0;
    socket.emit('setView', { code: roomCode, viewMode: elems.viewMode.value });
    socket.emit('startGame', { code: roomCode, maxLevels });
    hide('lobby');
    if (elems.viewMode.value === 'play') startPlay();
    else                                   startMap();
  });

  // Direct-link join
  (function checkDirectLink() {
    const params = new URLSearchParams(location.search);
    const live   = params.get('live');
    const name   = params.get('name');
    if (live) {
      roomCode = live;
      userName = name || 'Guest';
      socket.emit('joinRoom', { code: live, name: userName });
    }
  })();

  // ——— PLAY MODE ———
  function startPlay() {
    applySettings();
    if (solo) {
      layouts = [ generateMaze(25,25) ];
      players = { me:{ name:'You', pos:{x:0,y:0}, score:0 } };
    }
    currentLv = 0;
    displayLevelSplash(currentLv);
    resetPositions();
    hide('choose','login','lobby','map');
    show('play');
    if (!solo) socket.emit('joinRoom', { code: roomCode, name: userName });

    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup',   e => keys[e.key] = false);

    if (settings.timer) startTimer(settings.timerDuration);
    requestAnimationFrame(playLoop);
  }

  socket.on('gameStarted', data => {
    players = data.players;
    currentLv = 0;
    displayLevelSplash(currentLv);
    resetPositions();
    if (settings.timer) startTimer(settings.timerDuration);
  });
  socket.on('nextLevel', () => {
    currentLv++;
    displayLevelSplash(currentLv);
    resetPositions();
    if (settings.timer) startTimer(settings.timerDuration);
  });
  socket.on('levelComplete', () => {
    // TODO: confetti / sound
  });

  function displayLevelSplash(lv) {
    elems.splash.innerText = `Level ${lv+1}`;
    elems.splash.style.animation = 'splashIn 1.2s ease-out';
    setTimeout(() => elems.splash.style.animation = '', 1200);
  }

  function resetPositions() {
    Object.values(players).forEach(p => p.pos = { x:0, y:0 });
  }

  // Timer
  let timerInterval;
  function startTimer(sec) {
    clearInterval(timerInterval);
    let t = sec;
    elems.timerDisp.classList.remove('hidden');
    elems.timerDisp.innerText = `Time: ${t}s`;
    timerInterval = setInterval(() => {
      t--;
      elems.timerDisp.innerText = `Time: ${t}s`;
      if (t <= 0) {
        clearInterval(timerInterval);
        elems.timerDisp.innerText = `Time's up!`;
      }
    }, 1000);
  }

  // FPS Counter
  let lastFrame = performance.now(), frameCount = 0;
  function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastFrame >= 1000) {
      elems.fpsCounter.innerText = `FPS: ${frameCount}`;
      frameCount = 0;
      lastFrame = now;
    }
  }

  // Main play loop
  function playLoop() {
    ctxPlay.clearRect(0, 0, elems.playCanvas.width, elems.playCanvas.height);

    // draw walls
    ctxPlay.fillStyle = 'crimson';
    layouts[currentLv].forEach(w => {
      ctxPlay.fillRect(w.x*tile, w.y*tile, tile, tile);
    });

    // move
    const meKey = solo ? 'me' : socket.id;
    const me    = players[meKey];
    if (me) {
      if (keys['ArrowUp'])    me.pos.y -= speed;
      if (keys['ArrowDown'])  me.pos.y += speed;
      if (keys['ArrowLeft'])  me.pos.x -= speed;
      if (keys['ArrowRight']) me.pos.x += speed;
      if (!solo) socket.emit('playerMove', { code: roomCode, pos: me.pos });
    }

    // draw players
    Object.values(players).forEach(p => {
      ctxPlay.fillStyle = (p === me) ? 'dodgerblue' : 'orange';
      ctxPlay.fillRect(p.pos.x*tile, p.pos.y*tile, tile*0.8, tile*0.8);
    });

    // hint arrow
    if (settings.hints && me) {
      const ex = 24*tile + tile/2, ey = 24*tile + tile/2;
      const sx = me.pos.x*tile + tile/2, sy = me.pos.y*tile + tile/2;
      const ang = Math.atan2(ey - sy, ex - sx);
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

    if (settings.showFPS) updateFPS();
    requestAnimationFrame(playLoop);
  }

  // ——— MAP MODE ———
  function startMap() {
    applySettings();
    resetPositions();
    hide('choose','login','lobby','play');
    show('map');
    if (!solo) socket.emit('joinRoom', { code: roomCode, name: userName });
    requestAnimationFrame(mapLoop);
  }

  socket.on('playersUpdate', pls => players = pls);
  socket.on('levelComplete', data => {
    // final leaderboard
    elems.leaderboard.innerHTML = '<h3>Final Standings</h3>';
    data.leaderboard.forEach((p, i) => {
      const d = document.createElement('div');
      d.innerText = `${i+1}. ${p.name}`;
      elems.leaderboard.appendChild(d);
    });
  });

  function mapLoop() {
    ctxMap.clearRect(0,0, elems.mapCanvas.width, elems.mapCanvas.height);
    ctxMap.fillStyle = 'crimson';
    layouts[currentLv].forEach(w => {
      ctxMap.fillRect(w.x*tile, w.y*tile, tile, tile);
    });
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

  // INITIALIZE
  applySettings();
});