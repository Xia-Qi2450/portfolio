/* ============================================================
   XiaOS — easter-eggs.js
   Ported straight from the original site's script.js: matrix
   rain, konami code, the tab-title blur/focus gag, and the
   devtools console art. Plus the ` (backtick) global shortcut,
   now wired to the real Terminal app instead of a page overlay.
   ============================================================ */

window.matrixOn = false;

window.toggleMatrix = function toggleMatrix(){
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if(!canvas || !ctx) return;
  window.matrixOn = !window.matrixOn;
  if(window.matrixOn){
    canvas.classList.add('on');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);
    const chars = 'アイウエオカキクケコ0123456789XQ';
    clearInterval(window._matrixInterval);
    window._matrixInterval = setInterval(() => {
      ctx.fillStyle = 'rgba(10,13,16,0.09)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px monospace';
      for(let i = 0; i < drops.length; i++){
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.985 ? '#ff9d5c' : '#6ee7d8';
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 45);
  } else {
    clearInterval(window._matrixInterval);
    canvas.classList.remove('on');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  document.dispatchEvent(new CustomEvent('matrix-toggled', { detail: { on: window.matrixOn } }));
};

window.triggerKonami = function triggerKonami(){
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
};

(function initEasterEggs(){
  /* konami code (global, works anywhere in the OS) */
  const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiPos = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if(key === konamiSeq[konamiPos]){
      konamiPos++;
      if(konamiPos === konamiSeq.length){ window.triggerKonami(); konamiPos = 0; }
    } else {
      konamiPos = (key === konamiSeq[0]) ? 1 : 0;
    }
  });

  /* backtick — quick-launch the Terminal app from anywhere, like the original site */
  document.addEventListener('keydown', (e) => {
    if(e.key !== '`') return;
    const tag = (e.target && e.target.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA') return;
    if(!document.getElementById('boot').classList.contains('done')) return;
    e.preventDefault();
    if(window.Apps && window.Apps.terminal) window.Apps.terminal.open();
  });

  /* tab title easter egg */
  const baseTitle = document.title;
  window.addEventListener('blur', () => { document.title = 'come back! 🎧'; });
  window.addEventListener('focus', () => { document.title = baseTitle; });

  /* console art easter egg */
  console.log('%cXIA_QI // XiaOS', 'font-family:monospace;font-size:22px;font-weight:800;color:#ff9d5c;');
  console.log('%cnice of you to check devtools. try pressing ` anywhere for the terminal.', 'font-family:monospace;font-size:12px;color:#6ee7d8;');
})();
