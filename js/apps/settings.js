/* ============================================================
   XiaOS — apps/settings.js
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

const PANELS = [
  { id: 'personalization', label: 'Personalization', icon: APPICON.wallpaper },
  { id: 'sound', label: 'Sound', icon: APPICON.volume },
  { id: 'apps', label: 'Apps', icon: APPICON.apps },
  { id: 'accessibility', label: 'Accessibility', icon: APPICON.settings },
  { id: 'about', label: 'About', icon: APPICON.info },
];

function uptimeStr(){
  const ms = Date.now() - (window.XIAOS_BOOT_TIME || Date.now());
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  return m + 'm ' + sec + 's';
}

function applyAccent(id){
  const root = document.documentElement;
  if(id === 'copper') root.style.setProperty('--accent', 'var(--copper)');
  else if(id === 'cyan') root.style.setProperty('--accent', 'var(--cyan)');
  else root.style.removeProperty('--accent');
}
window.applyAccent = applyAccent;

function panelPersonalization(body){
  body.innerHTML = `
    <h2 style="font-family:var(--mono);font-size:15px;margin-bottom:16px;">Personalization</h2>
    <p class="settings-row-title" style="margin-bottom:8px;">Accent color</p>
    <p class="settings-row-sub" style="margin-bottom:10px;">Used for window highlights, the Start button glow, and focus outlines.</p>
    <div class="accent-row" id="accentRow"></div>
    <p class="settings-row-title" style="margin:26px 0 8px;">Wallpaper</p>
    <p class="settings-row-sub" style="margin-bottom:4px;">The circuit-board trace pattern, in a couple of moods.</p>
    <div class="wallpaper-grid" id="wallpaperGrid"></div>
    <div class="settings-row">
      <div class="settings-row-text"><p class="settings-row-title">Ambient trace animation</p><p class="settings-row-sub">Subtle glow pulse on the desktop board lines.</p></div>
      <div class="sw-toggle" id="toggleTrace"></div>
    </div>`;
  const accents = [ { id: 'copper', color: '#ff9d5c' }, { id: 'cyan', color: '#6ee7d8' }, { id: 'dual', color: 'linear-gradient(135deg,#ff9d5c,#6ee7d8)' } ];
  const row = qs('#accentRow', body);
  const current = LS.get('xiaos-accent') || 'dual';
  applyAccent(current);
  accents.forEach(a => {
    const sw = el('div', { class: 'accent-swatch' + (a.id === current ? ' sel' : ''), style: 'background:' + a.color + ';' });
    sw.addEventListener('click', () => {
      LS.set('xiaos-accent', a.id);
      applyAccent(a.id);
      qsa('.accent-swatch', row).forEach(s => s.classList.remove('sel'));
      sw.classList.add('sel');
      showToast('Accent set to ' + a.id);
    });
    row.appendChild(sw);
  });
  const wgrid = qs('#wallpaperGrid', body);
  const wallpapers = [
    { id: 'default', label: 'Copper Trace', bg: 'radial-gradient(ellipse at 20% -10%, rgba(255,157,92,0.35), transparent 60%), radial-gradient(ellipse at 100% 10%, rgba(110,231,216,0.28), #0a0d10 55%)' },
    { id: 'deep', label: 'Deep Board', bg: 'radial-gradient(ellipse at 50% 0%, rgba(110,231,216,0.22), #05070a 60%)' },
    { id: 'warm', label: 'Warm Solder', bg: 'radial-gradient(ellipse at 70% 100%, rgba(255,157,92,0.32), #0a0d10 60%)' },
  ];
  const curWallpaper = LS.get('xiaos-wallpaper') || 'default';
  wallpapers.forEach(w => {
    const opt = el('div', { class: 'wallpaper-opt' + (w.id === curWallpaper ? ' sel' : ''), style: 'background:' + w.bg + ';' }, el('span', {}, w.label));
    opt.addEventListener('click', () => {
      LS.set('xiaos-wallpaper', w.id);
      qsa('.wallpaper-opt', wgrid).forEach(o => o.classList.remove('sel'));
      opt.classList.add('sel');
      if(window.setWallpaper) window.setWallpaper(w.id);
    });
    wgrid.appendChild(opt);
  });
  const traceToggle = qs('#toggleTrace', body);
  const traceOn = LS.get('xiaos-trace') !== 'off';
  if(traceOn) traceToggle.classList.add('on');
  traceToggle.addEventListener('click', () => {
    const on = traceToggle.classList.toggle('on');
    LS.set('xiaos-trace', on ? 'on' : 'off');
    document.getElementById('desktop-trace').style.display = on ? '' : 'none';
  });
}

function panelSound(body){
  body.innerHTML = `
    <h2 style="font-family:var(--mono);font-size:15px;margin-bottom:16px;">Sound</h2>
    <div class="settings-row">
      <div class="settings-row-text"><p class="settings-row-title">Playlist volume</p><p class="settings-row-sub">Controls the Playlist app's audio element.</p></div>
      <input type="range" id="masterVol" min="0" max="1" step="0.01" style="width:140px;accent-color:var(--cyan);">
    </div>
    <div class="settings-row">
      <div class="settings-row-text"><p class="settings-row-title">Currently playing</p><p class="settings-row-sub" id="nowPlayingSub">Nothing right now.</p></div>
      <button class="btn" id="openPlaylistBtn" type="button">Open Playlist</button>
    </div>`;
  const vol = qs('#masterVol', body);
  vol.value = Apps.playlist ? Apps.playlist.getVolume() : 0.7;
  vol.addEventListener('input', () => { if(Apps.playlist) Apps.playlist.setVolume(parseFloat(vol.value)); });
  const sub = qs('#nowPlayingSub', body);
  const t = Apps.playlist && Apps.playlist.currentTrack();
  if(t) sub.textContent = (t.title || t.file) + (t.artist ? ' — ' + t.artist : '');
  qs('#openPlaylistBtn', body).addEventListener('click', () => Apps.playlist.open());
}

function panelApps(body){
  body.innerHTML = `<h2 style="font-family:var(--mono);font-size:15px;margin-bottom:16px;">Apps</h2><div id="appsListSettings"></div>`;
  const list = qs('#appsListSettings', body);
  const order = ['portfolio','playlist','explorer','terminal','taskmgr','settings'];
  order.forEach(id => {
    const a = Apps[id];
    if(!a) return;
    const row = el('div', { class: 'settings-row' }, [
      el('div', { class: 'settings-row-text' }, [
        el('p', { class: 'settings-row-title' }, a.title),
        el('p', { class: 'settings-row-sub' }, 'Built-in XiaOS app'),
      ]),
    ]);
    const openBtn = el('button', { class: 'btn', type: 'button' }, 'Open');
    openBtn.addEventListener('click', () => a.open());
    row.appendChild(openBtn);
    list.appendChild(row);
  });
}

function panelAccessibility(body){
  body.innerHTML = `
    <h2 style="font-family:var(--mono);font-size:15px;margin-bottom:16px;">Accessibility</h2>
    <div class="settings-row">
      <div class="settings-row-text"><p class="settings-row-title">Reduce motion</p><p class="settings-row-sub">Cuts window/menu animation and transitions.</p></div>
      <div class="sw-toggle" id="toggleReduce"></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-text"><p class="settings-row-title">Matrix rain</p><p class="settings-row-sub">The secret-terminal easter egg. Same as typing <code>matrix</code>.</p></div>
      <div class="sw-toggle" id="toggleMatrixSettings"></div>
    </div>`;
  const reduce = qs('#toggleReduce', body);
  if(document.body.classList.contains('reduce-motion')) reduce.classList.add('on');
  reduce.addEventListener('click', () => {
    const on = reduce.classList.toggle('on');
    document.body.classList.toggle('reduce-motion', on);
    LS.set('xiaos-reduce-motion', on ? 'on' : 'off');
  });
  const mtoggle = qs('#toggleMatrixSettings', body);
  if(window.matrixOn) mtoggle.classList.add('on');
  mtoggle.addEventListener('click', () => {
    if(window.toggleMatrix) window.toggleMatrix();
    mtoggle.classList.toggle('on', !!window.matrixOn);
  });
}

function panelAbout(body){
  body.innerHTML = `
    <h2 style="font-family:var(--mono);font-size:15px;margin-bottom:16px;">About XiaOS</h2>
    <div class="settings-neofetch" id="neofetchBlock"></div>
    <p class="settings-row-sub" style="margin-top:16px;">Source: <a class="inline-link" href="https://github.com/${XIA.handle}/portfolio" target="_blank" rel="noopener">github.com/${XIA.handle}/portfolio</a></p>`;
  const block = qs('#neofetchBlock', body);
  const refresh = () => {
    block.innerHTML =
      '<b>xia@qi</b>\n------\n' +
      'OS: <b>XiaOS v1.0</b> "Copper Trace"\n' +
      'Host: xia-qi.is-a.dev\n' +
      'Kernel: xwm (hand-rolled window manager)\n' +
      'Uptime: ' + uptimeStr() + '\n' +
      'Languages: Python, HTML, CSS, JavaScript, Luau\n' +
      'Apps: 6 built-in (Portfolio has 5 tabs)\n' +
      'Tracks loaded: ' + (typeof TRACKS !== 'undefined' ? TRACKS.length : 0);
  };
  refresh();
  const iv = setInterval(refresh, 1000);
  block._interval = iv;
}

const PANEL_RENDER = { personalization: panelPersonalization, sound: panelSound, apps: panelApps, accessibility: panelAccessibility, about: panelAbout };

Apps.settings = {
  id: 'settings', title: 'Settings', icon: APPICON.settings, accent: 'copper',
  open(startPanel){
    return WM.open({
      appId: 'settings', title: 'Settings', icon: APPICON.settings, accent: 'copper',
      width: 640, height: 500, singleton: true, noPad: true,
      render(body, win){
        body.innerHTML = `<div class="settings"><div class="settings-nav" id="settingsNav"></div><div class="settings-body" id="settingsBody"></div></div>`;
        const nav = qs('#settingsNav', body);
        const panelBody = qs('#settingsBody', body);
        let activeInterval = null;
        function show(id){
          if(activeInterval){ clearInterval(activeInterval); activeInterval = null; }
          qsa('.settings-nav-item', nav).forEach(n => n.classList.toggle('active', n.dataset.id === id));
          PANEL_RENDER[id](panelBody);
          const block = qs('#neofetchBlock', panelBody);
          if(block && block._interval) activeInterval = block._interval;
        }
        PANELS.forEach(p => {
          const item = el('div', { class: 'settings-nav-item', 'data-id': p.id }, [el('span', { html: p.icon }), el('span', {}, p.label)]);
          item.addEventListener('click', () => show(p.id));
          nav.appendChild(item);
        });
        show(startPanel && PANEL_RENDER[startPanel] ? startPanel : 'personalization');
        win.cleanup = () => { if(activeInterval) clearInterval(activeInterval); };
      },
    });
  },
};
})();
