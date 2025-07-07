// script.js
document.addEventListener('DOMContentLoaded', () => {
  // ——— Globals & State ———
  let peer          = null,
      conns         = {},       // host only: peerId → DataConnection
      clientConn    = null,     // client only: DataConnection to host
      isHost        = false,
      roomCode      = '',
      userName      = '',
      playerColor   = '#00AAFF',
      borderColor   = '#222222',
      layouts       = [],
      players       = {},       // peerId → { name, color, pos:{x,y}, score }
      curLevel      = 0,
      maxLevels     = 1

  const TILE_COUNT = 25,
        defaultSettings = {
          theme: 'light',
          borderColor: '#222222',
          audio: true
        }
  let settings = JSON.parse(
    localStorage.getItem('mzSettings') ||
    JSON.stringify(defaultSettings)
  )

  // ——— DOM Helpers & Elements ———
  const $ = s => document.querySelector(s)
  const screens = {
    choose:  $('#choose'),
    create:  $('#live-create'),
    join:    $('#live-join'),
    invalid: $('#invalid-qr'),
    lobby:   $('#lobby-screen'),
    play:    $('#play-screen'),
    map:     $('#map-screen')
  }
  const E = {
    // choose
    btnSolo:  $('#btn-solo'),
    btnLive:  $('#btn-live'),

    // create
    liveNameCreate:  $('#live-name-create'),
    liveColorCreate: $('#live-color-create'),
    btnCreate:       $('#btn-create'),
    btnToJoin:       $('#btn-to-join'),
    errCreate:       $('#live-err-create'),

    // join
    liveNameJoin:    $('#live-name-join'),
    liveColorJoin:   $('#live-color-join'),
    btnQRJoin:       $('#btn-qr-join'),
    invalid:         $('#invalid-qr'),
    invalidInput:    $('#invalid-code-input'),
    invalidJoinBtn:  $('#invalid-join-btn'),
    liveCode:        $('#live-code'),
    btnJoin:         $('#btn-join'),
    btnToCreate:     $('#btn-to-create'),
    errJoin:         $('#live-err-join'),

    // lobby
    roomCode:     $('#room-code'),
    roomCodeCopy: $('#room-code-copy'),
    qrCode:       $('#qr-code'),
    playersList:  $('#players-list'),
    viewMode:     $('#view-mode'),
    levelCount:   $('#level-count'),
    btnStart:     $('#btn-start'),

    // settings
    btnSettings:    $('#btn-settings'),
    settingsModal:  $('#settingsModal'),
    settingTheme:   $('#setting-theme'),
    settingBorder:  $('#setting-border-color'),
    settingAudio:   $('#setting-audio'),
    settingsSave:   $('#settingsSave'),
    settingsCancel: $('#settingsCancel'),

    // play/map
    playC:      $('#playCanvas'),
    mapC:       $('#mapCanvas'),
    splash:     $('#levelSplash'),
    timerDisp:  $('#timerDisplay'),
    fpsCounter: $('#fpsCounter'),
    leaderboard:$('#leaderboard')
  }

  const ctxPlay = E.playC.getContext('2d'),
        ctxMap  = E.mapC.getContext('2d')

  function show(...ids){ ids.forEach(id=>screens[id].classList.remove('hidden')) }
  function hide(...ids){ ids.forEach(id=>screens[id].classList.add('hidden')) }
  function error(msg, where='create'){
    const el = where==='join' ? E.errJoin : E.errCreate
    el.innerText = msg
    setTimeout(()=>el.innerText = '', 2000)
  }

  // ——— Resize & Tiles ———
  let TILE, ox, oy
  function resize(){
    [E.playC,E.mapC].forEach(c=>{
      c.width = innerWidth
      c.height = innerHeight
    })
    TILE = Math.min(innerWidth,innerHeight)/TILE_COUNT
    const mw = TILE_COUNT * TILE
    ox = (innerWidth - mw)/2
    oy = (innerHeight - mw)/2
  }
  window.addEventListener('resize', resize)
  resize()

  // ——— Settings ———
  function applySettings(){
    document.body.className = settings.theme
    borderColor = settings.borderColor
    E.btnSettings.style.display = isHost ? 'block' : 'none'
    E.settingTheme.value  = settings.theme
    E.settingBorder.value = settings.borderColor
    E.settingAudio.checked= settings.audio
  }
  function saveSettings(){
    settings.theme       = E.settingTheme.value
    settings.borderColor = E.settingBorder.value
    settings.audio       = E.settingAudio.checked
    localStorage.setItem('mzSettings', JSON.stringify(settings))
    applySettings()
    E.settingsModal.classList.add('hidden')
  }
  E.btnSettings.addEventListener('click', () => E.settingsModal.classList.remove('hidden'))
  E.settingsCancel.addEventListener('click', () => E.settingsModal.classList.add('hidden'))
  E.settingsSave.addEventListener('click', saveSettings)

  // ——— Maze Generator ———
  function generateMaze(){
    const grid = Array(TILE_COUNT).fill().map(()=>Array(TILE_COUNT).fill(0))
    const vis = JSON.parse(JSON.stringify(grid))
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]]
    function shuffle(a){ a.sort(()=>Math.random()-.5) }
    function carve(x,y){
      vis[x][y]=1; grid[x][y]=1
      shuffle(dirs)
      dirs.forEach(([dx,dy])=>{
        const nx=x+dx*2, ny=y+dy*2
        if(nx>=0&&nx<TILE_COUNT&&ny>=0&&ny<TILE_COUNT&&!vis[nx][ny]){
          grid[x+dx][y+dy]=1
          carve(nx,ny)
        }
      })
    }
    carve(0,0)
    const walls=[]
    for(let i=0;i<TILE_COUNT;i++)
      for(let j=0;j<TILE_COUNT;j++)
        if(!grid[i][j]) walls.push({x:j,y:i})
    return walls
  }

  // ——— P2P Host & Client Setup ———
  function hostPeer(code){
    peer = new Peer(code, { host:'peerjs.com', secure:true, port:443 })
    peer.on('open',()=>console.log('Host peer:', peer.id))
    peer.on('connection', conn=>{
      conn.on('data', msg => handleMsg(conn, msg))
      conn.on('open', ()=>{ conn.send({type:'players',players}) })
      conns[conn.peer] = conn
    })
  }

  function clientPeer(code){
    peer = new Peer(null, { host:'peerjs.com', secure:true, port:443 })
    peer.on('open', id=>{
      console.log('Client peer:', id)
      clientConn = peer.connect(code)
      clientConn.on('open',()=>{
        clientConn.send({
          type:'join', id, name:userName, color:playerColor
        })
      })
      clientConn.on('data', msg => handleMsg(clientConn,msg))
    })
  }

  function broadcast(msg){
    Object.values(conns).forEach(c=>{ if(c.open) c.send(msg) })
  }

  function handleMsg(conn,msg){
    switch(msg.type){
      case 'join':
        if(!isHost) return
        players[msg.id] = { name:msg.name, color:msg.color, pos:{x:0,y:0},score:0 }
        renderLobby()
        broadcast({type:'players',players})
        break
      case 'players':
        players = msg.players
        renderLobby()
        break
      case 'move':
        if(players[msg.id]) players[msg.id].pos = msg.pos
        break
      case 'startGame':
        layouts = Array.from({length:msg.maxLevels},generateMaze)
        curLevel=0
        if(!isHost) startPlay()
        break
      case 'nextLevel':
        curLevel++
        if(!isHost) startPlay()
        break
      case 'levelComplete':
        showMap(msg.leaderboard)
        break
    }
  }

  // ——— UI Renders & Flows ———
  function renderLobby(){
    E.playersList.innerHTML = ''
    Object.values(players).forEach(p=>{
      const li = document.createElement('li')
      li.innerHTML = `<span style="color:${p.color}">■</span> ${p.name}`
      E.playersList.appendChild(li)
    })
  }

  function showLevelSplash(lv){
    E.splash.innerText = `Level ${lv+1}`
    E.splash.style.animation = 'splashIn 1.2s ease-out'
    setTimeout(()=>E.splash.style.animation='',1200)
  }
  function resetPositions(){
    Object.values(players).forEach(p=>p.pos = {x:0,y:0})
  }

  // ——— Single-Tile Movement ———
  function onKey(e){
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return
    e.preventDefault(); moveOne(e.key)
  }
  function moveOne(dir){
    const id = peer.id
    const me = players[id]
    if(!me) return
    let nx=me.pos.x, ny=me.pos.y
    if(dir==='ArrowUp')    ny--
    if(dir==='ArrowDown')  ny++
    if(dir==='ArrowLeft')  nx--
    if(dir==='ArrowRight') nx++
    if(nx<0||nx>=TILE_COUNT||ny<0||ny>=TILE_COUNT) return
    if(layouts[curLevel].some(w=>w.x===nx&&w.y===ny)) return
    me.pos={x:nx,y:ny}
    if(!isHost) clientConn.send({type:'move',id:peer.id,pos:me.pos})
  }

  // ——— Draw Loops ———
  function playLoop(){
    ctxPlay.clearRect(0,0,E.playC.width,E.playC.height)
    const mw=TILE_COUNT*TILE, x0=ox, y0=oy
    ctxPlay.strokeStyle = borderColor; ctxPlay.lineWidth = 2
    ctxPlay.beginPath()
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0+mw,y0)
    ctxPlay.moveTo(x0,y0); ctxPlay.lineTo(x0,y0+mw)
    ctxPlay.moveTo(x0+mw,y0); ctxPlay.lineTo(x0+mw,y0+mw)
    const ex=x0+(TILE_COUNT-1)*TILE, ey=y0+mw
    ctxPlay.moveTo(x0,ey); ctxPlay.lineTo(ex,ey)
    ctxPlay.moveTo(ex+TILE,ey); ctxPlay.lineTo(x0+mw,ey)
    ctxPlay.stroke()

    ctxPlay.fillStyle=borderColor
    layouts[curLevel].forEach(w=>
      ctxPlay.fillRect(x0+w.x*TILE,y0+w.y*TILE,TILE,TILE)
    )

    ctxPlay.fillStyle='lime'
    ctxPlay.fillRect(x0,y0,TILE,TILE)
    ctxPlay.fillStyle='gold'
    ctxPlay.fillRect(ex,y0+(TILE_COUNT-1)*TILE,TILE,TILE)

    Object.values(players).forEach(p=>{
      ctxPlay.fillStyle=p.color
      ctxPlay.fillRect(
        x0+p.pos.x*TILE,
        y0+p.pos.y*TILE,
        TILE*0.8,TILE*0.8
      )
    })

    requestAnimationFrame(playLoop)
  }

  function mapLoop(){
    ctxMap.clearRect(0,0,E.mapC.width,E.mapC.height)
    playLoop.call()
    ctxMap.fillStyle='#0f0'
    Object.values(players).forEach(p=>{
      const px=ox+p.pos.x*TILE+TILE/2,
            py=oy+p.pos.y*TILE+TILE/2
      ctxMap.beginPath()
      ctxMap.arc(px,py,TILE/3,0,2*Math.PI)
      ctxMap.fill()
    })
    requestAnimationFrame(mapLoop)
  }

  // ——— Solo / Live Flows ———
  E.btnSolo.addEventListener('click', ()=>{ solo=true; startPlay(); })

  E.btnLive.addEventListener('click', ()=>{
    hide('choose'); show('create')
  })

  // Create
  E.btnToJoin.addEventListener('click', ()=>{ hide('create'); show('join') })
  E.btnCreate.addEventListener('click', ()=>{
    const n=E.liveNameCreate.value.trim(),
          c=E.liveColorCreate.value
    if(!n) return error('Enter username','create')
    userName = n; playerColor = c
    roomCode   = Math.random().toString(36).substr(2,4).toUpperCase()
    isHost     = true
    players     = {}
    players[roomCode] = { name:n, color:c, pos:{x:0,y:0}, score:0 }
    hostPeer(roomCode)
    renderLobby()
    hide('create','choose','join','invalid')
    show('lobby')
    applySettings()
  })

  // Join
  E.btnToCreate.addEventListener('click', ()=>{ hide('join','invalid'); show('create') })
  E.btnQRJoin.addEventListener('click', ()=>{/* uses URL params */})
  E.invalidJoinBtn.addEventListener('click', ()=>{
    const code=E.invalidInput.value.trim().toUpperCase(),
          n=E.liveNameJoin.value.trim(),
          c=E.liveColorJoin.value
    if(!n||!code) return error('All fields required','join')
    userName= n; playerColor=c; roomCode=code
    clientPeer(roomCode)
    renderLobby()
    hide('create','join','invalid','choose')
    show('lobby')
    applySettings()
  })
  E.btnJoin.addEventListener('click', ()=>{
    const code=E.liveCode.value.trim().toUpperCase(),
          n=E.liveNameJoin.value.trim(),
          c=E.liveColorJoin.value
    if(!n||!code) return error('Both required','join')
    userName= n; playerColor=c; roomCode=code
    clientPeer(roomCode)
    renderLobby()
    hide('create','join','invalid','choose')
    show('lobby')
    applySettings()
  })

  // Start
  E.btnStart.addEventListener('click', ()=>{
    if(!isHost) return
    maxLevels = parseInt(E.levelCount.value)||1
    layouts   = Array.from({length:maxLevels},generateMaze)
    curLevel  = 0
    broadcast({ type:'startGame', maxLevels })
    hide('lobby')
    if(E.viewMode.value==='play') startPlay()
    else startMap()
  })

  // Handle invalid QR
  (()=>{
    const p=new URLSearchParams(location.search),
          live=p.get('live'),
          nm=p.get('name'),
          col=p.get('color')
    if(live&&nm&&col){
      userName    = decodeURIComponent(nm)
      playerColor = col
      roomCode    = live.toUpperCase()
      clientPeer(roomCode)
      hide('choose','create','join','invalid')
      show('lobby')
      renderLobby()
      applySettings()
    }
  })()

  // Initialization
  applySettings()
})