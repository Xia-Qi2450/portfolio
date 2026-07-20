/* ============================================================
   XiaOS — taskbar.js
   ============================================================ */

const Taskbar = (() => {
  const PINNED = ['portfolio','playlist','explorer','terminal','taskmgr','settings'];
  let minimizedByShowDesktop = [];

  function findWinByAppId(appId){
    return WM.list().find(w => w.appId === appId) || null;
  }

  function renderApps(){
    const host = document.getElementById('tb-apps');
    host.innerHTML = '';
    PINNED.forEach(id => {
      const app = Apps[id];
      if(!app) return;
      const w = findWinByAppId(id);
      const running = !!w;
      const active = !!(w && w.el.classList.contains('focused') && !w.minimized);
      const b = el('button', { class: 'tb-app' + (running ? ' running' : '') + (active ? ' active' : ''), type: 'button', title: app.title }, [
        el('span', { class: 'tb-app-icon', html: app.icon }),
        el('span', { class: 'tb-app-label' }, app.title),
        el('span', { class: 'tb-dot' }),
      ]);
      b.addEventListener('click', () => {
        const inst = findWinByAppId(id);
        if(!inst) app.open();
        else WM.toggleMinimizeFromTaskbar(inst.id);
      });
      host.appendChild(b);
    });
  }

  function renderClock(){
    const t = document.getElementById('tcTime');
    const d = document.getElementById('tcDate');
    if(t) t.textContent = nowTimeStr();
    if(d) d.textContent = nowDateStr();
  }

  function toggleShowDesktop(){
    const anyVisible = WM.list().some(w => !w.minimized);
    if(anyVisible){
      minimizedByShowDesktop = WM.list().filter(w => !w.minimized).map(w => w.id);
      WM.minimizeAll();
    } else {
      minimizedByShowDesktop.forEach(id => WM.restore(id));
      minimizedByShowDesktop = [];
    }
  }

  function wireTray(){
    document.getElementById('tbSearchIcon').innerHTML = APPICON.search;
    document.getElementById('trayMatrix').innerHTML = APPICON.matrix;
    document.getElementById('trayNetwork').innerHTML = APPICON.network;
    document.getElementById('trayVolume').innerHTML = APPICON.volume;
    document.getElementById('trayBell').innerHTML = APPICON.bell;
    const matrixBtn = document.getElementById('trayMatrix');
    matrixBtn.addEventListener('click', () => {
      window.toggleMatrix();
      matrixBtn.classList.toggle('matrix-on', !!window.matrixOn);
    });
    document.getElementById('trayNetwork').addEventListener('click', () => ActionCenter.toggle());
    document.getElementById('trayVolume').addEventListener('click', () => ActionCenter.toggle());
    document.getElementById('trayBell').addEventListener('click', () => ActionCenter.toggle());
    document.getElementById('tbClock').addEventListener('click', () => ActionCenter.toggle());
    document.getElementById('tbShowDesktop').addEventListener('click', toggleShowDesktop);
  }

  function init(){
    document.getElementById('tbStart').addEventListener('click', (e) => { e.stopPropagation(); StartMenu.toggle(); });
    const quickSearch = document.getElementById('smQuickSearch');
    document.getElementById('tbSearchBox').addEventListener('click', () => { StartMenu.open(); StartMenu.focusSearch(); });
    quickSearch.addEventListener('focus', () => { StartMenu.open(); const real = document.getElementById('smSearchInput'); real.value = quickSearch.value; real.dispatchEvent(new Event('input')); real.focus(); quickSearch.value = ''; });
    wireTray();
    renderApps();
    renderClock();
    setInterval(renderClock, 15000);
    ['wm:open','wm:close','wm:focus','wm:minimize','wm:restore'].forEach(ev => document.addEventListener(ev, renderApps));
    document.addEventListener('matrix-toggled', (e) => { document.getElementById('trayMatrix').classList.toggle('matrix-on', e.detail.on); });
    document.getElementById('taskbar').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      ContextMenu.open(e.clientX, e.clientY - 8, [
        { label: 'Task Manager', icon: APPICON.activity, handler: () => Apps.taskmgr.open() },
        { label: 'Show the desktop', icon: APPICON.view, handler: toggleShowDesktop },
        { label: 'Taskbar settings', icon: APPICON.settings, handler: () => Apps.settings.open('personalization') },
      ]);
    });
  }

  return { init, renderApps };
})();

const ActionCenter = (() => {
  function render(){
    const panel = document.getElementById('actioncenter');
    panel.innerHTML = `
      <p class="ac-title">Quick settings</p>
      <div class="ac-toggles">
        <div class="ac-toggle" id="acMatrix">${APPICON.matrix}<span>Matrix rain</span></div>
        <div class="ac-toggle" id="acReduce">${APPICON.settings}<span>Reduce motion</span></div>
        <div class="ac-toggle on">${APPICON.network}<span>Copper Trace LAN</span></div>
        <div class="ac-toggle on">${APPICON.chip}<span>XiaOS v1.0</span></div>
      </div>
      <div class="ac-slider-row">${APPICON.volume}<input type="range" id="acVolume" min="0" max="1" step="0.01"></div>
      <p class="ac-brightness-label">Playlist volume</p>
      <p class="ac-title" style="margin-top:16px;">Notifications</p>
      <p style="font-family:var(--mono);font-size:11.5px;color:var(--ink-faint);">You're all caught up.</p>`;
    const mtoggle = document.getElementById('acMatrix');
    mtoggle.classList.toggle('on', !!window.matrixOn);
    mtoggle.addEventListener('click', () => { window.toggleMatrix(); mtoggle.classList.toggle('on', !!window.matrixOn); });
    const rtoggle = document.getElementById('acReduce');
    rtoggle.classList.toggle('on', document.body.classList.contains('reduce-motion'));
    rtoggle.addEventListener('click', () => {
      const on = document.body.classList.toggle('reduce-motion');
      rtoggle.classList.toggle('on', on);
      LS.set('xiaos-reduce-motion', on ? 'on' : 'off');
    });
    const vol = document.getElementById('acVolume');
    vol.value = Apps.playlist ? Apps.playlist.getVolume() : 0.7;
    vol.addEventListener('input', () => { if(Apps.playlist) Apps.playlist.setVolume(parseFloat(vol.value)); });
  }
  function open(){ render(); document.getElementById('actioncenter').classList.add('open'); }
  function close(){ document.getElementById('actioncenter').classList.remove('open'); }
  function toggle(){ const p = document.getElementById('actioncenter'); p.classList.contains('open') ? close() : open(); }
  function init(){
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('actioncenter');
      if(panel.classList.contains('open') && !safeClosest(e.target, '#actioncenter') && !safeClosest(e.target, '#tb-tray') && !safeClosest(e.target, '.tb-clock')) close();
    });
  }
  return { open, close, toggle, init };
})();
