document.addEventListener("DOMContentLoaded", () => {

  // ============================
  // ELEMENTS
  // ============================
  const player = document.getElementById("player");
  const nowPlaying = document.getElementById("now-playing");
  const toggleBtn = document.getElementById("toggle");
  const skipBtn = document.getElementById("skip");
  const replayBtn = document.getElementById("replay");
  const shareBtn = document.getElementById("share");
  const shareBox = document.getElementById("share-box");
  const shareLink = document.getElementById("share-link");
  const closeShare = document.getElementById("close-share");

  // ============================
  // RADIO STATE
  // ============================
  let queue = [];
  let currentDoc = null;
  let lastDoc = null;
  let page = 1;

  // Read URL parameters
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "music";
  const s = params.get("s");

  // ============================
  // FETCH MORE TRACKS
  // ============================
  async function fetchMore() {
    const url = "https://archive.org/advancedsearch.php?" + new URLSearchParams({
      q: `(${q}) AND mediatype:(audio)`,
      output: "json",
      rows: "1",
      page: page++,
      sort: "downloads desc"
    });

    const res = await fetch(url);
    const data = await res.json();
    const docs = data.response.docs;

    if (docs.length) queue.push(docs[0]);
  }

  // ============================
  // RESOLVE AUDIO FILE
  // ============================
  async function resolveAudio(identifier) {
    const metaURL = `https://archive.org/metadata/${identifier}`;
    const res = await fetch(metaURL);
    const meta = await res.json();

    const file = meta.files.find(f =>
      /\.(mp3|ogg|wav|flac)$/i.test(f.name)
    );

    return file
      ? `https://archive.org/download/${identifier}/${file.name}`
      : "";
  }

  // ============================
  // PLAY A TRACK
  // ============================
  async function playDoc(doc) {
    if (!doc) return;

    lastDoc = currentDoc;
    currentDoc = doc;

    nowPlaying.textContent = doc.title || doc.identifier;

    const src = await resolveAudio(doc.identifier);
    player.src = src;
    player.play();

    updateToggleButton();
    fetchMore(); // keep queue filled
  }

  // ============================
  // UPDATE PLAY/PAUSE BUTTON
  // ============================
  function updateToggleButton() {
    if (player.paused) {
      toggleBtn.innerHTML = `<svg><use href="#ic-play"/></svg> Play`;
    } else {
      toggleBtn.innerHTML = `<svg><use href="#ic-pause"/></svg> Pause`;
    }
  }

  // ============================
  // BUTTON EVENTS
  // ============================
  toggleBtn.addEventListener("click", () => {
    if (!player.src && queue.length) {
      playDoc(queue.shift());
    } else if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
    updateToggleButton();
  });

  skipBtn.addEventListener("click", () => {
    if (queue.length) playDoc(queue.shift());
  });

  replayBtn.addEventListener("click", () => {
    if (lastDoc) playDoc(lastDoc);
  });

  player.addEventListener("play", updateToggleButton);
  player.addEventListener("pause", updateToggleButton);

  // Auto-play next track
  player.addEventListener("ended", () => {
    if (queue.length) {
      playDoc(queue.shift());
    } else {
      fetchMore().then(() => {
        if (queue.length) playDoc(queue.shift());
      });
    }
  });

  // ============================
  // SHARE BUTTON
  // ============================
  shareBtn.addEventListener("click", () => {
    if (!currentDoc) return;

    const base = location.origin + location.pathname;
    const link = `${base}?s=${encodeURIComponent(currentDoc.identifier)}&q=${encodeURIComponent(q)}`;

    shareLink.textContent = link;
    shareBox.classList.add("active");
  });

  closeShare.addEventListener("click", () => {
    shareBox.classList.remove("active");
    shareLink.textContent = "";
  });

  // Close share box when clicking outside the modal
  shareBox.addEventListener("click", (e) => {
    if (e.target === shareBox) {
      shareBox.classList.remove("active");
      shareLink.textContent = "";
    }
  });

  // ============================
  // ACCESS GATE
  // ============================
  if (!localStorage.getItem("accessKey")) {
    window.location.href = "https://camcookiem.github.io/archive/v/";
  }

  // ============================
  // INITIAL LOAD
  // ============================
  (async function init() {
    await fetchMore();

    // If shared link contains ?s=
    if (s) {
      const doc = queue.find(d => d.identifier === s);
      if (doc) {
        await playDoc(doc);
        return;
      }
    }

    if (queue.length) playDoc(queue.shift());
  })();

});