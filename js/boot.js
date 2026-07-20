/* ============================================================
   XiaOS — boot.js
   POST -> bootloader (GRUB-esque) -> kernel log -> lock screen
   -> desktop. Also exposes window.XiaOS.{lock,restart,shutdown}.
   ============================================================ */

const Boot = (() => {
  let fastForward = false;

  function delay(ms){
    return new Promise((resolve) => setTimeout(resolve, fastForward ? 0 : ms));
  }

  function showStage(id){
    qsa('.boot-stage').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  /* ---------------- POST ---------------- */
  const POST_LINES = [
    { label: 'CPU', val: 'Python 3.x Interpreter Core i-DIY @ 3.11GHz', status: 'ok' },
    { label: 'Boot Device', val: 'GITHUB-SSD0 (Xia-Qi2450/portfolio)', status: 'ok' },
    { label: 'Storage', val: BUILDS.length + ' pinned repos found', status: 'ok' },
    { label: 'Audio Device', val: 'HDA Codec — /music (' + (TRACKS_FALLBACK.length) + ' tracks)', status: 'ok' },
    { label: 'Input', val: 'Arduino HID Adapter', status: 'ok' },
    { label: 'Display', val: '3D-printed bezel, PC build verified', status: 'ok' },
    { label: 'Network', val: 'Copper Trace LAN — link up', status: 'ok' },
    { label: 'Keyboard', val: '104-key detected — backtick key highlighted', status: 'ok' },
  ];

  async function runPost(){
    showStage('stage-post');
    const body = document.getElementById('postBody');
    body.innerHTML = '';
    const header = el('div', { class: 'post-header' }, 'XiaOS UEFI BIOS — v2.4.50-copper');
    const sub = el('div', { class: 'post-sub' }, 'Copyright (C) Xia Qi Circuit Works. All rights reserved.');
    body.appendChild(header); body.appendChild(sub);
    await delay(160);

    // spam Enter 5x within ~1.1s during POST and you end up in a (joke) BIOS setup screen
    let biosTriggered = false, mashCount = 0, mashTimer = null;
    function onMash(e){
      if(e.key !== 'Enter') return;
      mashCount++;
      clearTimeout(mashTimer);
      mashTimer = setTimeout(() => { mashCount = 0; }, 1100);
      if(mashCount >= 5) biosTriggered = true;
    }
    document.addEventListener('keydown', onMash);

    for(const line of POST_LINES){
      if(biosTriggered) break;
      const row = el('div', { class: 'post-line' }, [
        document.createTextNode(line.label.padEnd(14, '.') + ' '),
        el('span', { class: 'val' }, line.val + ' '),
        el('span', { class: 'ok' }, line.status.toUpperCase()),
      ]);
      body.appendChild(row);
      await delay(90);
    }
    if(!biosTriggered){
      const mem = el('div', { class: 'post-mem' }, 'Memory Test: 0K');
      body.appendChild(mem);
      for(const kb of [16384, 32768, 49152, 65536]){
        if(biosTriggered) break;
        await delay(70);
        mem.textContent = 'Memory Test: ' + kb + 'K' + (kb === 65536 ? ' OK' : '');
      }
    }
    document.removeEventListener('keydown', onMash);
    clearTimeout(mashTimer);

    if(biosTriggered){
      await runBiosSetup();
      await runGrub();
      return;
    }

    const footer = el('div', { class: 'post-footer' }, [
      document.createTextNode('Press '), el('kbd', {}, 'DEL'), document.createTextNode(' to enter SETUP   '),
      el('kbd', {}, 'F8'), document.createTextNode(' Boot Menu   '), el('kbd', {}, '`'), document.createTextNode(' Secret Terminal (works everywhere in XiaOS)'),
    ]);
    body.appendChild(footer);
    await waitForAnyKeyOrTimeout(2600);
    await runGrub();
  }

  /* ---------------- BIOS setup utility (the enter-mash easter egg) ---------------- */
  const BIOS_TABS = ['Main', 'Advanced', 'Boot', 'Security', 'Exit'];

  function biosRow(label, val, interactive, onClick){
    const row = el('div', { class: 'bios-row' + (interactive ? ' bios-interactive' : '') }, [
      el('span', { class: 'br-label' }, label), el('span', { class: 'br-val' }, val),
    ]);
    if(interactive) row.addEventListener('click', onClick);
    return row;
  }

  function runBiosSetup(){
    return new Promise((resolve) => {
      showStage('stage-bios');
      const menubar = document.getElementById('biosMenubar');
      const bodyEl = document.getElementById('biosBody');
      let tabIndex = 0;

      function renderTabs(){
        menubar.innerHTML = '';
        BIOS_TABS.forEach((t, i) => {
          const b = el('button', { class: 'bios-tab' + (i === tabIndex ? ' active' : ''), type: 'button' }, t);
          b.addEventListener('click', () => { tabIndex = i; renderTabs(); renderBody(); });
          menubar.appendChild(b);
        });
      }

      function renderBody(){
        bodyEl.innerHTML = '';
        const tab = BIOS_TABS[tabIndex];
        if(tab === 'Main'){
          [
            ['BIOS Version', 'XiaOS-2.4.50-copper'],
            ['System Date', nowDateStr()],
            ['System Time', nowTimeStr()],
            ['CPU Type', 'Python 3.x Interpreter Core i-DIY @ 3.11GHz'],
            ['Total Memory', '65536K'],
            ['Repos Detected', String(BUILDS.length)],
            ['Tracks Detected', String(TRACKS_FALLBACK.length)],
          ].forEach(([l, v]) => bodyEl.appendChild(biosRow(l, v)));
          bodyEl.appendChild(el('p', { class: 'bios-note' }, 'This is a joke BIOS. Nothing here is real, except the numbers.'));
        } else if(tab === 'Advanced'){
          bodyEl.appendChild(biosRow('Secret Terminal', '[Enabled]'));
          bodyEl.appendChild(biosRow('Matrix Rain Support', '[Enabled]'));
          bodyEl.appendChild(biosRow('Konami Code Detection', '[Enabled]'));
          bodyEl.appendChild(biosRow('Rickroll Protection', '[Disabled]'));
          bodyEl.appendChild(biosRow('Copper Trace Overclock', '[Disabled] (not recommended)'));
          const reduceOn = document.body.classList.contains('reduce-motion');
          bodyEl.appendChild(biosRow('Reduce Motion', reduceOn ? '[Enabled]' : '[Disabled]', true, () => {
            const on = document.body.classList.toggle('reduce-motion');
            LS.set('xiaos-reduce-motion', on ? 'on' : 'off');
            renderBody();
          }));
          bodyEl.appendChild(el('p', { class: 'bios-note' }, 'Click "Reduce Motion" to actually toggle it — everything else here is flavor text.'));
        } else if(tab === 'Boot'){
          [
            ['1st Boot Device', 'XiaOS SSD (GitHub Pages)'],
            ['2nd Boot Device', 'classic.html (Legacy Mode)'],
            ['3rd Boot Device', 'Floppy Disk (Not Found)'],
          ].forEach(([l, v]) => bodyEl.appendChild(biosRow(l, v)));
        } else if(tab === 'Security'){
          bodyEl.appendChild(biosRow('Supervisor Password', 'Not Installed'));
          bodyEl.appendChild(biosRow('User Password', 'Not Installed'));
          bodyEl.appendChild(el('p', { class: 'bios-note' }, "This BIOS has no password because it's a static website."));
        } else if(tab === 'Exit'){
          bodyEl.appendChild(el('p', { class: 'bios-note', style: 'margin-top:0;' }, 'You mashed Enter during POST and ended up here. Exit to resume booting XiaOS.'));
          const btn = el('button', { class: 'bios-exit-btn', type: 'button' }, 'Exit Setup (resume booting)');
          btn.addEventListener('click', finish);
          bodyEl.appendChild(btn);
        }
      }

      function finish(){
        document.removeEventListener('keydown', onKey);
        resolve();
      }
      function onKey(e){
        if(e.key === 'ArrowLeft'){ e.preventDefault(); tabIndex = (tabIndex - 1 + BIOS_TABS.length) % BIOS_TABS.length; renderTabs(); renderBody(); }
        else if(e.key === 'ArrowRight'){ e.preventDefault(); tabIndex = (tabIndex + 1) % BIOS_TABS.length; renderTabs(); renderBody(); }
        else if(e.key === 'Escape' || e.key === 'F10'){ finish(); }
      }
      document.addEventListener('keydown', onKey);
      renderTabs();
      renderBody();
      if(fastForward) finish();
    });
  }

  function waitForAnyKeyOrTimeout(ms){
    if(fastForward) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if(done) return; done = true; document.removeEventListener('keydown', onKey); document.removeEventListener('click', onKey); resolve(); };
      const onKey = () => finish();
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onKey);
      setTimeout(finish, ms);
    });
  }

  /* ---------------- GRUB-esque bootloader ---------------- */
  const GRUB_ITEMS = [
    { id: 'default', label: 'XiaOS' },
    { id: 'safe', label: 'XiaOS (safe mode — reduced motion)' },
    { id: 'classic', label: 'Boot into classic site (pre-OS pages)' },
  ];

  function runGrub(){
    return new Promise((resolve) => {
      showStage('stage-grub');
      const menu = document.getElementById('grubMenu');
      menu.innerHTML = '';
      let sel = 0;
      let countdown = 5;
      GRUB_ITEMS.forEach((it, i) => {
        const li = el('li', { class: 'grub-item' + (i === 0 ? ' sel' : '') }, [el('span', { class: 'arrow' }, i === 0 ? '➜' : ''), document.createTextNode(it.label)]);
        menu.appendChild(li);
      });
      const countdownEl = document.getElementById('grubCountdown');
      function renderSel(){
        qsa('.grub-item', menu).forEach((li, i) => {
          li.classList.toggle('sel', i === sel);
          li.querySelector('.arrow').textContent = i === sel ? '➜' : '';
        });
      }
      function finish(){
        document.removeEventListener('keydown', onKey);
        clearInterval(timer);
        const choice = GRUB_ITEMS[sel].id;
        if(choice === 'safe'){ document.body.classList.add('reduce-motion'); LS.set('xiaos-reduce-motion', 'on'); }
        if(choice === 'classic'){ window.location.href = 'classic.html'; return; }
        resolve();
      }
      function onKey(e){
        if(e.key === 'ArrowUp'){ sel = (sel - 1 + GRUB_ITEMS.length) % GRUB_ITEMS.length; renderSel(); clearInterval(timer); countdownEl.textContent = 'auto-boot cancelled'; }
        else if(e.key === 'ArrowDown'){ sel = (sel + 1) % GRUB_ITEMS.length; renderSel(); clearInterval(timer); countdownEl.textContent = 'auto-boot cancelled'; }
        else if(e.key === 'Enter'){ finish(); }
      }
      document.addEventListener('keydown', onKey);
      let timer = setInterval(() => {
        countdown--;
        if(countdownEl) countdownEl.textContent = String(countdown) + 's';
        if(countdown <= 0){ clearInterval(timer); finish(); }
      }, fastForward ? 0 : 1000);
      if(fastForward){ clearInterval(timer); finish(); }
    }).then(runKernelLog);
  }

  /* ---------------- kernel log ---------------- */
  const KLOG_LINES = [
    { text: 'XiaOS kernel booting (xwm-6.9-copper)', tag: null },
    { text: 'Initializing copper/cyan bus...', tag: null },
    { text: 'Started Copper Trace Network Daemon', tag: 'ok' },
    { text: 'Mounted /home/xiaqi', tag: 'ok' },
    { text: 'Loaded stack.dll (Python, HTML, CSS, JS, Luau)', tag: 'ok' },
    { text: 'Parsed builds.json (' + BUILDS.length + ' projects)', tag: 'ok' },
    { text: 'Parsed anime.json', tag: 'ok' },
    { text: 'Mounted /music (' + TRACKS_FALLBACK.length + ' tracks)', tag: 'ok' },
    { text: 'Initialized secret terminal daemon', tag: 'ok' },
    { text: 'Starting Window Manager (xwm)', tag: 'ok' },
    { text: 'Starting Desktop Shell', tag: 'ok' },
    { text: 'Reached target Graphical Interface', tag: 'ok' },
  ];

  async function runKernelLog(){
    showStage('stage-klog');
    const body = document.getElementById('klogBody');
    body.innerHTML = '';
    const wrap = el('div', { class: 'klog-progress-wrap' }, [
      el('div', { class: 'klog-bar' }, el('div', { class: 'klog-bar-fill', id: 'klogFill' })),
      el('div', { class: 'klog-label', id: 'klogLabel' }, 'Loading assets...'),
    ]);
    for(let i = 0; i < KLOG_LINES.length; i++){
      const l = KLOG_LINES[i];
      const ts = (i * 0.0482 + 0.01).toFixed(6);
      const row = el('div', { class: 'klog-line' }, [
        el('span', { class: 'ts' }, '[ ' + ts + '] '),
        l.tag ? el('span', { class: 'tag-' + l.tag }, '[  ' + l.tag.toUpperCase() + '  ] ') : null,
        document.createTextNode(l.text),
      ]);
      body.appendChild(row);
      await delay(110);
    }
    body.appendChild(wrap);
    const fill = document.getElementById('klogFill');
    const label = document.getElementById('klogLabel');
    const steps = ['Loading stack.dll...', 'Loading builds.json...', 'Loading anime.json...', 'Loading music library...', 'Starting desktop shell...', 'Welcome to XiaOS.'];
    for(let i = 0; i < steps.length; i++){
      label.textContent = steps[i];
      fill.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
      await delay(140);
    }
    await delay(260);
    await runLock();
  }

  /* ---------------- lock screen ---------------- */
  function updateLockClock(){
    const t = document.getElementById('lockTime');
    const d = document.getElementById('lockDate');
    if(t) t.textContent = nowTimeStr();
    if(d) d.textContent = nowDateLongStr();
  }
  let lockClockInterval = null;

  function runLock(){
    return new Promise((resolve) => {
      document.getElementById('stage-lock').style.display = 'flex'
      showStage('stage-lock');
      document.getElementById('lockSignin').classList.remove('show');
      document.getElementById('lockScreenMain').style.display = '';
      updateLockClock();
      clearInterval(lockClockInterval);
      lockClockInterval = setInterval(updateLockClock, 1000);

      function toSignIn(){
        document.removeEventListener('keydown', toSignIn);
        document.getElementById('stage-lock').removeEventListener('click', toSignInClick);
        document.getElementById('lockScreenMain').style.display = 'none';
        document.getElementById('lockSignin').classList.add('show');
      }
      function toSignInClick(e){ if(safeClosest(e.target, '.lock-signin')) return; toSignIn(); }
      document.addEventListener('keydown', toSignIn, { once: true });
      document.getElementById('stage-lock').addEventListener('click', toSignInClick);

      document.getElementById('lockSigninBtn').onclick = () => {
        clearInterval(lockClockInterval);
        resolve();
      };
      if(fastForward){ toSignIn(); clearInterval(lockClockInterval); resolve(); }
    });
  }

  /* ---------------- enter desktop ---------------- */
  function enterDesktop(){
    document.getElementById('boot').classList.add('done');
    document.getElementById('os').classList.add('ready');
    window.XIAOS_BOOT_TIME = Date.now();
    setTimeout(() => showNotification('Welcome back', 'XiaOS is ready. Press ` anywhere for the terminal.', 'copper'), 700);
  }

  /* ---------------- skip button ---------------- */
  function wireSkip(){
    document.getElementById('bootSkip').addEventListener('click', () => { fastForward = true; });
  }

  /* ---------------- public: run full sequence or resume ---------------- */
  async function start(){
    document.getElementById('stage-lock').style.display = 'none'
    wireSkip();
    document.getElementById('boot').classList.remove('done');
    document.getElementById('os').classList.remove('ready');
    await runPost();
    enterDesktop();
  }

  async function fullRestart(){
    fastForward = false;
    WM.closeAll();
    document.getElementById('stage-lock').style.display = 'none'
    document.getElementById('boot').classList.remove('done');
    document.getElementById('os').classList.remove('ready');
    showToast('restarting XiaOS...');
    await delay(500);
    await runPost();
    enterDesktop();
  }

  function lockScreen(){
    document.getElementById('stage-lock').style.display = 'flex'
    document.getElementById('boot').classList.remove('done');
    document.getElementById('os').classList.remove('ready');
    runLock().then(enterDesktop);
  }

  function shutdown(){
    document.getElementById('stage-lock').style.display = 'none'
    document.getElementById('boot').classList.remove('done');
    document.getElementById('os').classList.remove('ready');
    showStage('stage-post');
    const body = document.getElementById('postBody');
    body.innerHTML = '';
    body.appendChild(el('div', { class: 'post-header' }, 'XiaOS is shutting down...'));
    body.appendChild(el('div', { class: 'post-sub' }, 'It is now safe to close this tab.'));
    setTimeout(() => {
      body.appendChild(el('div', { class: 'post-line', style: 'opacity:1;margin-top:22px;' }, [
        document.createTextNode('Changed your mind? '),
        (() => { const b = document.createElement('button'); b.className = 'boot-skip'; b.style.position = 'static'; b.textContent = 'Turn XiaOS back on'; b.onclick = fullRestart; return b; })(),
      ]));
    }, 900);
  }

  return { start, fullRestart, lockScreen, shutdown };
})();

window.XiaOS = {
  lock: () => Boot.lockScreen(),
  restart: () => Boot.fullRestart(),
  shutdown: () => Boot.shutdown(),
};
