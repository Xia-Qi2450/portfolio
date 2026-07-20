/* ============================================================
   XiaOS — desktop.js
   Desktop icons, right-click context menu, wallpaper + ambient
   circuit-trace decoration.
   ============================================================ */

const Desktop = (() => {
  const ICONS_LIST = [
    { id: 'thispc', label: 'This PC', icon: APPICON.thispc, action: () => Apps.explorer.open() },
    { id: 'portfolio', label: 'Portfolio', icon: APPICON.portfolio, action: () => Apps.portfolio.open() },
    { id: 'playlist', label: 'Playlist', icon: APPICON.playlist, action: () => Apps.playlist.open() },
    { id: 'terminal', label: 'Terminal', icon: APPICON.terminal, action: () => Apps.terminal.open() },
    { id: 'taskmgr', label: 'Task Manager', icon: APPICON.activity, action: () => Apps.taskmgr.open() },
    { id: 'settings', label: 'Settings', icon: APPICON.settings, action: () => Apps.settings.open() },
    { id: 'github', label: 'GitHub.lnk', icon: APPICON.external, action: () => window.open('https://github.com/' + XIA.handle, '_blank', 'noopener') },
    { id: 'recyclebin', label: 'Recycle Bin', icon: APPICON.recycle, action: () => showToast('empty. (this is a static site — there is nothing to delete.)') },
  ];

  function renderIcons(){
    const wrap = document.getElementById('desktop-icons');
    wrap.innerHTML = '';
    ICONS_LIST.forEach(ic => {
      const item = el('div', { class: 'dicon', tabindex: '0', 'data-id': ic.id }, [
        el('div', { class: 'di-glyph', html: ic.icon }),
        el('div', { class: 'di-label' }, ic.label),
      ]);
      item.addEventListener('click', (e) => { e.stopPropagation(); selectIcon(item); });
      item.addEventListener('dblclick', (e) => { e.stopPropagation(); ic.action(); });
      item.addEventListener('keydown', (e) => { if(e.key === 'Enter') ic.action(); });
      wrap.appendChild(item);
    });
  }

  function selectIcon(item){
    qsa('.dicon').forEach(i => i.classList.remove('sel'));
    item.classList.add('sel');
  }
  function deselectAll(){ qsa('.dicon').forEach(i => i.classList.remove('sel')); }

  /* ---------- ambient trace decoration ---------- */
  function renderTrace(){
    const host = document.getElementById('desktop-trace');
    const on = LS.get('xiaos-trace') !== 'off';
    host.style.display = on ? '' : 'none';
    const w = 1400, h = 900;
    host.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="opacity:.5;">
        <path d="M -20 120 H 300 L 340 160 V 420 L 380 460 H 900" fill="none" stroke="#ff9d5c" stroke-width="1.4" opacity="0.28"/>
        <path d="M ${w + 20} 220 H ${w - 340} L ${w - 380} 260 V 560 L ${w - 420} 600 H 760" fill="none" stroke="#6ee7d8" stroke-width="1.4" opacity="0.24"/>
        <path d="M 120 ${h + 20} V ${h - 260} L 160 ${h - 300} H 520" fill="none" stroke="#6ee7d8" stroke-width="1.2" opacity="0.18"/>
        <circle cx="900" cy="460" r="3.2" fill="#ff9d5c" opacity="0.8"><animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.6s" repeatCount="indefinite"/></circle>
        <circle cx="760" cy="600" r="3.2" fill="#6ee7d8" opacity="0.7"><animate attributeName="opacity" values="0.85;0.2;0.85" dur="3.1s" repeatCount="indefinite"/></circle>
        <circle cx="340" cy="160" r="2.6" fill="#ff9d5c" opacity="0.6"><animate attributeName="opacity" values="0.8;0.15;0.8" dur="2.2s" repeatCount="indefinite"/></circle>
      </svg>`;
  }
  window.setWallpaper = function(id){
    const desktop = document.getElementById('desktop');
    const presets = {
      default: '',
      deep: 'radial-gradient(ellipse 1000px 600px at 50% 0%, rgba(110,231,216,0.14), transparent 60%), var(--bg)',
      warm: 'radial-gradient(ellipse 1000px 600px at 70% 100%, rgba(255,157,92,0.18), transparent 60%), var(--bg)',
    };
    if(id === 'default'){ desktop.style.backgroundImage = ''; }
    else { desktop.style.background = presets[id] || ''; }
  };

  /* ---------- context menu ---------- */
  function openCtx(x, y){
    ContextMenu.open(x, y, [
      { label: 'View: medium icons', icon: APPICON.view, handler: () => showToast('already looking pretty medium.') },
      { label: 'Sort by name', icon: APPICON.sort, handler: () => renderIcons() },
      { label: 'Refresh', icon: APPICON.refresh, handler: () => { renderTrace(); showToast('Desktop refreshed.'); } },
      'sep',
      { label: 'New Terminal window', icon: APPICON.terminal, handler: () => Apps.terminal.open() },
      { label: 'Task Manager', icon: APPICON.activity, handler: () => Apps.taskmgr.open() },
      'sep',
      { label: 'Personalize', icon: APPICON.wallpaper, handler: () => Apps.settings.open('personalization') },
      { label: 'Display settings', icon: APPICON.settings, handler: () => Apps.settings.open('personalization') },
    ]);
  }

  function init(){
    renderIcons();
    renderTrace();
    const desktop = document.getElementById('desktop');
    desktop.addEventListener('click', (e) => { if(e.target === desktop || e.target.id === 'desktop-icons') deselectAll(); ContextMenu.close(); });
    desktop.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      deselectAll();
      openCtx(e.clientX, e.clientY);
    });
    document.addEventListener('click', (e) => { if(!safeClosest(e.target, '.ctxmenu')) ContextMenu.close(); });
    window.addEventListener('resize', renderTrace);
    if(LS.get('xiaos-wallpaper')) window.setWallpaper(LS.get('xiaos-wallpaper'));
    if(LS.get('xiaos-reduce-motion') === 'on') document.body.classList.add('reduce-motion');
  }

  return { init, deselectAll, closeCtx: ContextMenu.close };
})();
