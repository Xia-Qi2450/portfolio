/* ---- nav active state ---- */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topnav a[href]').forEach(a => {
    if(a.getAttribute('href') === path){ a.classList.add('active'); }
  });
})();

/* ---- reveal on scroll ---- */
const revealables = document.querySelectorAll('.node, .hub-link');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
revealables.forEach(n => io.observe(n));

/* ---- copy discord ---- */
function copyDiscord(){
  navigator.clipboard.writeText('dw_aelious').then(() => {
    document.querySelectorAll('#copyDiscord, #copyDiscord2').forEach(btn => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1600);
    });
  }).catch(() => {});
}
document.querySelectorAll('#copyDiscord, #copyDiscord2').forEach(btn => btn.addEventListener('click', copyDiscord));

/* ---- toast ---- */
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg, ms){
  if(!toastEl) {return;};
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 2600);
}

/* ---- tab title easter egg ---- */
const baseTitle = document.title;
window.addEventListener('blur', () => { document.title = 'come back! 🎧'; });
window.addEventListener('focus', () => { document.title = baseTitle; });

/* ---- console art easter egg ---- */
console.log('%cXIA_QI', 'font-family:monospace;font-size:22px;font-weight:800;color:#ff9d5c;');
console.log('%cnice of you to check devtools. try pressing ` on the page for something extra.', 'font-family:monospace;font-size:12px;color:#6ee7d8;');

/* ---- avatar click easter egg ---- */
(function(){
  const avatarImg = document.getElementById('avatarImg');
  if(!avatarImg) {return;}
  let avatarClicks = 0;
  avatarImg.addEventListener('click', () => {
    avatarClicks++;
    avatarImg.style.transform = 'rotate(' + (avatarClicks * 72) + 'deg)';
    if(avatarClicks === 5){
      showToast('🌀 okay, you really like clicking. hi.');
      avatarClicks = 0;
    }
  });
})();

/* ================= MUSIC PLAYER ================= */
let tracks = [];
let playByQuery = function(){ return null; };

(function(){
  const playerBox = document.getElementById('playerBox');
  if(!playerBox) {return;};

  const audio = new Audio();
  audio.volume = 0.7;
  let currentIndex = -1;
  let isPlaying = false;

  const playerTitle = document.getElementById('playerTitle');
  const playerArtist = document.getElementById('playerArtist');
  const playerArt = document.getElementById('playerArt');
  const playBtn = document.getElementById('playBtn');
  const seekEl = document.getElementById('seek');
  const curTimeEl = document.getElementById('curTime');
  const durTimeEl = document.getElementById('durTime');
  const trackListEl = document.getElementById('trackList');
  const volumeEl = document.getElementById('volume');

  const formatTime = (s) => {
    if(!isFinite(s) || s === null) {return '0:00';}
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  };
  const escapeHtml = (s) => {
    const d = document.createElement('div');
    d.textContent = s === null ? '' : String(s);
    return d.innerHTML;
  };

  const renderTrackList = () => {
    trackListEl.innerHTML = '';
    if(!tracks.length){
      trackListEl.innerHTML = '<li class="track-empty">no tracks yet — drop files in /music/ with a tracks.json</li>';
      return;
    }
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'track-item' + (i === currentIndex ? ' playing' : '');
      li.innerHTML = '<span class="t-name">' + escapeHtml(t.title || t.file) + '</span><span class="t-artist">' + escapeHtml(t.artist || '') + '</span>';
      li.addEventListener('click', () => selectTrack(i, true));
      trackListEl.appendChild(li);
    });
  };

  const loadTracks = async () => {
    try{
      const res = await fetch('music/tracks.json');
      if(!res.ok) {throw new Error('missing');}
      const data = await res.json();
      if(!Array.isArray(data) || !data.length) {throw new Error('empty');}
      tracks = data;
      renderTrackList();
    } catch(err){
      renderTrackList();
      console.warn('Failed to load tracks.json: ' + err.message);
    }
  };

  function selectTrack(i, autoplay){
    if(!tracks[i]) {return;};
    currentIndex = i;
    const t = tracks[i];
    audio.src = t.file;
    audio.load();
    playerTitle.textContent = t.title || t.file;
    playerArtist.textContent = t.artist || '';
    playerArt.innerHTML = t.cover ? '<img src="' + t.cover + '" alt="">' : '🎵';
    renderTrackList();
    if(autoplay){
      audio.play().then(() => { isPlaying = true; playBtn.textContent = '⏸'; }).catch(() => {});
    }
  }

  function togglePlay(){
    if(currentIndex === -1){ if(tracks.length){ selectTrack(0, true); } return; }
    if(isPlaying){ audio.pause(); isPlaying = false; playBtn.textContent = '▶'; }
    else { audio.play().then(() => { isPlaying = true; playBtn.textContent = '⏸'; }).catch(() => {}); }
  }
  function nextTrack(){ if(!tracks.length) {return;} selectTrack((currentIndex + 1) % tracks.length, true); }
  function prevTrack(){ if(!tracks.length) {return;} selectTrack((currentIndex - 1 + tracks.length) % tracks.length, true); }

  playBtn.addEventListener('click', togglePlay);
  document.getElementById('nextBtn').addEventListener('click', nextTrack);
  document.getElementById('prevBtn').addEventListener('click', prevTrack);
  volumeEl.addEventListener('input', () => { audio.volume = parseFloat(volumeEl.value); });
  seekEl.addEventListener('input', () => { if(audio.duration){ audio.currentTime = (seekEl.value / 100) * audio.duration; } });
  audio.addEventListener('timeupdate', () => {
    if(audio.duration){ seekEl.value = (audio.currentTime / audio.duration) * 100; curTimeEl.textContent = formatTime(audio.currentTime); }
  });
  audio.addEventListener('loadedmetadata', () => { durTimeEl.textContent = formatTime(audio.duration); });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('pause', () => { isPlaying = false; playBtn.textContent = '▶'; });
  audio.addEventListener('play', () => { isPlaying = true; playBtn.textContent = '⏸'; });

  loadTracks();

  playByQuery = function(query){
    const q = query.toLowerCase();
    const idx = tracks.findIndex(t => (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q));
    if(idx !== -1){
      selectTrack(idx, true);
      playerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return tracks[idx];
    }
    return null;
  };
})();

/* ================= SECRET TERMINAL (present on every page) ================= */
(function(){
  const termOverlay = document.getElementById('termOverlay');
  const termBody = document.getElementById('termBody');
  const termInput = document.getElementById('termInput');
  if(!termOverlay || !termBody || !termInput) {return;};

    const fileSystem = {
    'about.txt': "I'm Xia Qi, a student who spends way too much time writing Python, designing websites, and coming up with project ideas that somehow keep getting bigger.",
    'skills.txt': "software: Python, HTML, CSS, JavaScript, Luau\nhardware: Arduino, 3D Printing, PC Building, Minecraft Modding",
    'music.playlist': "now playing:\n- Hatsune Miku (various)\n- Kasane Teto (various)\n- DELTARUNE OST\n- ULTRAKILL OST",
    'contact.txt': "ShitHub: github.com/Xia-Qi2450\ndiscord: dw_aelious\nemail: xiaqihill2010@gmail.com",
    'anime.txt': "Dude... \nWho would want to see someone's anime.txt file? \nYou just got baited.",
    'ultrakilltechs.txt': "I play the game for fun. \nI have learnt no cool techniques. \nI don't even know how to railcoin.",
  };
  const hiddenFiles = {
    'secret.txt': "you found the hidden file. 🐾\nfun fact: the 'dogcheck' repo exists purely because of a Toby Fox bit. no regrets.",
    'bruh.txt' : "Never gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you",
    'miku.txt' : "[Verse 1] \nMiku, Miku, you can call me Miku \nBlue hair, blue tie, hiding in your Wi-Fi \nOpen secrets, anyone can find me \nHear your music running through my mind \n\n[Chorus] \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \n\n[Pre-Chorus] \nI'm on top of the world because of you \nAll I wanted to do is follow you \nI'll keep singing along to all of you \nI'll keep singing along \n\n[Chorus] \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh)"
  };
  const repoList = [
    ['dogcheck', 'DELTARUNE dogcheck screen, on the web', 'github.com/Xia-Qi2450/dogcheck'],
    ['robo-queue', 'robotics competition prep helper', 'github.com/Xia-Qi2450/robo-queue'],
    ['SCP_Data', 'TUI reader for the SCP Wiki', 'github.com/Xia-Qi2450/SCP_Data'],
    ['ttsScript', 'text-to-speech via pyttsx3', 'github.com/Xia-Qi2450/ttsScript'],
    ['animeClassPython', 'ran out of ideas, ended up here', 'github.com/Xia-Qi2450/animeClassPython'],
    ['EulerProjectAttempts', 'Project Euler archive attempts', 'github.com/Xia-Qi2450/EulerProjectAttempts'],
  ];

  let termOpened = false;
  const cmdHistory = [];
  let histPos = -1;
  let matrixOn = false;

  function tprint(text, cls){
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }
  function tprintMulti(text, cls){ text.split('\n').forEach(l => tprint(l, cls)); }
  function tprintDelayed(lines, delayEach){
    lines.forEach((l, i) => setTimeout(() => tprint(l.text, l.cls), i * delayEach));
  }

  function welcomeBanner(){
    tprint("xia-qi terminal — type 'help' to see what's here.", 'dim');
    tprint('');
  }

  function openTerm(){
    termOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if(!termOpened){ welcomeBanner(); termOpened = true; }
    termInput.value = '';
    termInput.focus();
    termBody.scrollTop = termBody.scrollHeight;
  }
  function closeTerm(){
    termOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function runRmJoke(){
    tprintDelayed([
      { text: 'this had better be a joke...', cls: 'dim' },
      { text: 'deleting /home/xia...', cls: 'dim' },
      { text: 'deleting /etc/dog...', cls: 'dim' },
      { text: 'deleting the concept of bugs...', cls: 'dim' },
      { text: "wait, that's not how any of this works.", cls: 'dim' },
      { text: "jk — this is a static site. there's nothing to rm. 🐾", cls: 'ok' },
    ], 420);
  }

  function runCommand(raw){
    const trimmed = raw.trim();
    if(trimmed.length){ cmdHistory.push(trimmed); }
    histPos = cmdHistory.length;
    tprint('guest@xia-qi:~$ ' + raw, 'in-line');
    if(!trimmed.length) {return;}

    if(trimmed.includes(':(){') || trimmed.includes(':|:&')){
      tprint("nice try. this terminal doesn't have a shell to bomb.", 'err');
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch(cmd){
      case 'help':
        tprintMulti(
          "available commands:\n" +
          "  help              show this list\n" +
          "  whoami            about me\n" +
          "  neofetch          system info, allegedly\n" +
          "  ls [-a]           list files\n" +
          "  cat <file>        read a file\n" +
          "  projects          list pinned repos\n" +
          "  contact           how to reach me\n" +
          "  play <name>       play a track, or try miku / teto\n" +
          "  matrix            uh oh\n" +
          "  sudo <cmd>        try it\n" +
          "  konami            you know what this does\n" +
          "  clear             clear the screen\n" +
          "  exit              close terminal\n" +
          "  (a few commands aren't listed here. good luck.)"
        );
        break;
      case 'whoami':
        tprintMulti("xia_qi — student, frontend+backend dev, occasional hardware tinkerer.\nprobably debugging something right now.");
        break;
      case 'neofetch':
        tprintMulti(
          "xia@qi\n" +
          "------\n" +
          "OS: XiaOS (definitely just a portfolio site)\n" +
          "Shell: zsh --fake\n" +
          "Languages: Python, HTML/CSS/JS, Luau\n" +
          "Hobbies: 3D printing, Arduino, PC building, Minecraft modding\n" +
          "NOW PLAYING: KEYGEN CHURCH - Tenebre Rosso Sangue (ULTRAKILL Soundtrack)\n" +
          "Uptime: since forever, brain still compiling"
        );
        break;
      case 'ls':
        if(args[0] === '-a'){
          tprint(Object.keys(fileSystem).join('  ') + '  ' + Object.keys(hiddenFiles).join('  '));
          tprint('(found a few hidden ones, huh)', 'dim');
        } else {
          tprint(Object.keys(fileSystem).join('  '));
        }
        break;
      case 'cat':
        if(!args[0]){ tprint('usage: cat <file>', 'err'); break; }
        if(fileSystem[args[0]]){ tprintMulti(fileSystem[args[0]]); }
        else if(hiddenFiles[args[0]]){ tprintMulti(hiddenFiles[args[0]], 'ok'); }
        else { tprint('cat: ' + args[0] + ': No such file or directory', 'err'); }
        break;
      case 'projects':
        repoList.forEach(([name, desc, url]) => {
          tprint(name.padEnd(22) + '— ' + desc);
          tprint('  ' + url, 'dim');
        });
        break;
      case 'contact':
        tprintMulti(fileSystem['contact.txt']);
        break;
      case 'play': {
        if(!args[0]){ tprint('usage: play <name>', 'err'); break; }
        const found = playByQuery(args.join(' '));
        if(found){
          tprint('▸ now playing: ' + (found.title || found.file) + (found.artist ? ' — ' + found.artist : ''), 'ok');
        } else if(args[0].toLowerCase() === 'miku'){
          tprint('▸ now playing: Hatsune Miku — synth vocals engaged. 🟢 (add real tracks to music/tracks.json to actually hear something)', 'ok');
        } else if(args[0].toLowerCase() === 'teto'){
          tprint('▸ now playing: Kasane Teto — bread reserves: nominal. 🍞 (add real tracks to music/tracks.json to actually hear something)', 'ok');
        } else {
          tprint("can't find that track. try 'play miku', 'play teto', or add it to music/tracks.json.", 'err');
        }
        break;
      }
      case 'rm':
        if(args.includes('-rf') && args.includes('/')){ runRmJoke(); }
        else { tprint('rm: missing operand (also, there is nothing to delete here)', 'err'); }
        break;
      case 'sudo':
        if(args.includes('rm') && args.includes('-rf') && args.includes('/')){ runRmJoke(); }
        else if(args.join(' ').includes('make me a sandwich')){ tprint('sudo: okay fine. 🥪 (still not real food though)', 'ok'); }
        else if(args[0] === 'su'){ tprint('sudo su: you are now root. (you were already root — it\'s a static site.)', 'dim'); }
        else { tprint('sudo: permission denied. nice try though.', 'err'); }
        break;
      case 'sl':
        tprint('choo choo! 🚂💨 (pretty sure you meant \'ls\')', 'dim');
        break;
      case 'vim':
      case ':q':
      case ':wq':
        tprint("how do you exit vim? nobody actually knows. try 'exit' instead.", 'err');
        break;
      case 'hack':
        tprint('access granted. jk — this is a portfolio site, not a heist movie. 🛰️', 'dim');
        break;
      case '42':
        tprint('the answer to life, the universe, and everything.', 'ok');
        break;
      case 'konami':
        triggerKonami();
        break;
      case 'echo':
        tprint(args.join(' '));
        break;
      case 'date':
        tprint(new Date().toString());
        break;
      case 'matrix':
        toggleMatrix();
        tprint(matrixOn ? 'wake up...' : 'back to reality.', 'dim');
        break;
      case 'clear':
        termBody.innerHTML = '';
        break;
      case 'exit':
        tprint("Bye!", "ok");
        closeTerm();
        break;
      default:
        tprint("command not found: " + cmd + " — type 'help' to see what's available.", 'err');
    }
  }

  termInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const val = termInput.value;
      termInput.value = '';
      runCommand(val);
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(cmdHistory.length){ histPos = Math.max(0, histPos - 1); termInput.value = cmdHistory[histPos] || ''; }
    } else if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(cmdHistory.length){ histPos = Math.min(cmdHistory.length, histPos + 1); termInput.value = cmdHistory[histPos] || ''; }
    }
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && termOverlay.classList.contains('open')){ closeTerm(); return; }
    if(e.key === '`' && !termOverlay.classList.contains('open')){ e.preventDefault(); openTerm(); }
  });
  termOverlay.addEventListener('mousedown', (e) => { if(e.target === termOverlay) {closeTerm();} });

  /* ---- matrix rain ---- */
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let matrixInterval = null;
  window.toggleMatrix = function toggleMatrix(){
    if(!canvas || !ctx) {return;}
    matrixOn = !matrixOn;
    if(matrixOn){
      canvas.classList.add('on');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const fontSize = 15;
      const columns = Math.floor(canvas.width / fontSize);
      const drops = new Array(columns).fill(1);
      const chars = 'アイウエオカキクケコ0123456789XQ';
      matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(10,13,16,0.09)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px monospace';
        for(let i = 0; i < drops.length; i++){
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = Math.random() > 0.985 ? '#ff9d5c' : '#6ee7d8';
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
          if(drops[i] * fontSize > canvas.height && Math.random() > 0.975){ drops[i] = 0; }
          drops[i]++;
        }
      }, 45);
    } else {
      clearInterval(matrixInterval);
      canvas.classList.remove('on');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  // local alias used inside this closure
  const toggleMatrix = window.toggleMatrix;

  /* ---- konami code (global) ---- */
  const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiPos = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if(key === konamiSeq[konamiPos]){
      konamiPos++;
      if(konamiPos === konamiSeq.length){ triggerKonami(); konamiPos = 0; }
    } else {
      konamiPos = (key === konamiSeq[0]) ? 1 : 0;
    }
  });
  function triggerKonami(){
    showToast('🎉 dogcheck: passed. you found the konami code.', 3200);
    const emojis = ['🐾','🎵','✨','🍞','🟢'];
    for(let i = 0; i < 26; i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      piece.style.fontSize = (14 + Math.random() * 14) + 'px';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4200);
    }
  }
})();
