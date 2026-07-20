/* ============================================================
   XiaOS — startmenu.js
   ============================================================ */

const StartMenu = (() => {
  const PINNED = ['portfolio','playlist','explorer','terminal','taskmgr','settings'];
  const SEARCH_EXTRAS = [
    { label: 'Home', icon: APPICON.home, sub: 'Portfolio tab', action: () => Apps.portfolio.open('home') },
    { label: 'Stack', icon: APPICON.stack, sub: 'Portfolio tab', action: () => Apps.portfolio.open('stack') },
    { label: 'Builds', icon: APPICON.builds, sub: 'Portfolio tab', action: () => Apps.portfolio.open('builds') },
    { label: 'Off Duty', icon: APPICON.offduty, sub: 'Portfolio tab', action: () => Apps.portfolio.open('offduty') },
    { label: 'Connect', icon: APPICON.connect, sub: 'Portfolio tab', action: () => Apps.portfolio.open('connect') },
  ];
  let recent = [];

  function trackRecent(appId){
    recent = recent.filter(id => id !== appId);
    recent.unshift(appId);
    recent = recent.slice(0, 4);
  }

  function renderGrid(){
    const grid = document.getElementById('smGrid');
    grid.innerHTML = '';
    PINNED.forEach(id => {
      const app = Apps[id];
      if(!app) return;
      const b = el('button', { class: 'sm-app', type: 'button' }, [
        el('span', { class: 'sa-icon', html: app.icon }),
        el('span', { class: 'sa-label' }, app.title),
      ]);
      b.addEventListener('click', () => { app.open(); trackRecent(id); close(); });
      grid.appendChild(b);
    });
  }

  function renderRecent(){
    const list = document.getElementById('smList');
    list.innerHTML = '';
    if(!recent.length){
      list.appendChild(el('p', { class: 'sm-empty' }, "Nothing opened yet — try the Portfolio, Task Manager, or the Terminal."));
      return;
    }
    recent.forEach(id => {
      const app = Apps[id];
      if(!app) return;
      const b = el('button', { class: 'sm-list-item', type: 'button' }, [
        el('span', { class: 'sa-icon', html: app.icon }),
        el('div', { class: 'li-text' }, [el('span', { class: 'li-title' }, app.title), el('span', { class: 'li-sub' }, 'XiaOS app')]),
      ]);
      b.addEventListener('click', () => { app.open(); trackRecent(id); close(); });
      list.appendChild(b);
    });
  }

  function renderSearchResults(query){
    const grid = document.getElementById('smGrid');
    const list = document.getElementById('smList');
    const gridSection = document.getElementById('smGridSection');
    const listTitle = document.getElementById('smListTitle');
    const q = query.trim().toLowerCase();
    if(!q){
      gridSection.style.display = '';
      listTitle.textContent = 'Recommended';
      renderGrid(); renderRecent();
      return;
    }
    gridSection.style.display = 'none';
    listTitle.textContent = 'Search results';
    list.innerHTML = '';
    const appMatches = PINNED.filter(id => Apps[id] && Apps[id].title.toLowerCase().includes(q));
    const extraMatches = SEARCH_EXTRAS.filter(x => x.label.toLowerCase().includes(q));
    if(!appMatches.length && !extraMatches.length){
      list.appendChild(el('p', { class: 'sm-empty' }, `No apps found for "${escapeHtml(query)}".`));
      return;
    }
    appMatches.forEach(id => {
      const app = Apps[id];
      const b = el('button', { class: 'sm-list-item', type: 'button' }, [
        el('span', { class: 'sa-icon', html: app.icon }),
        el('div', { class: 'li-text' }, [el('span', { class: 'li-title' }, app.title), el('span', { class: 'li-sub' }, 'App')]),
      ]);
      b.addEventListener('click', () => { app.open(); trackRecent(id); close(); });
      list.appendChild(b);
    });
    extraMatches.forEach(x => {
      const b = el('button', { class: 'sm-list-item', type: 'button' }, [
        el('span', { class: 'sa-icon', html: x.icon }),
        el('div', { class: 'li-text' }, [el('span', { class: 'li-title' }, x.label), el('span', { class: 'li-sub' }, x.sub)]),
      ]);
      b.addEventListener('click', () => { x.action(); trackRecent('portfolio'); close(); });
      list.appendChild(b);
    });
  }

  function open(){
    renderGrid(); renderRecent();
    document.getElementById('startmenu').classList.add('open');
    document.getElementById('tbStart').classList.add('on');
  }
  function close(){
    document.getElementById('startmenu').classList.remove('open');
    document.getElementById('tbStart').classList.remove('on');
    closePower();
    const input = document.getElementById('smSearchInput');
    if(input) input.value = '';
  }
  function toggle(){ document.getElementById('startmenu').classList.contains('open') ? close() : open(); }
  function focusSearch(){ const input = document.getElementById('smSearchInput'); if(input) input.focus(); }

  function openPower(){ document.getElementById('smPowerMenu').classList.add('open'); }
  function closePower(){ document.getElementById('smPowerMenu').classList.remove('open'); }
  function togglePower(e){ e.stopPropagation(); document.getElementById('smPowerMenu').classList.contains('open') ? closePower() : openPower(); }

  function init(){
    qs('.sm-search span').innerHTML = APPICON.search;
    document.getElementById('smPowerBtn').innerHTML = APPICON.power;
    document.getElementById('smPowerLock').innerHTML = APPICON.lock + '<span>Lock</span>';
    document.getElementById('smPowerRestart').innerHTML = APPICON.restart + '<span>Restart</span>';
    document.getElementById('smPowerShutdown').innerHTML = APPICON.power + '<span>Shut down</span>';
    document.getElementById('smSearchInput').addEventListener('input', (e) => renderSearchResults(e.target.value));
    document.getElementById('smPowerBtn').addEventListener('click', togglePower);
    document.getElementById('smPowerLock').addEventListener('click', () => { close(); window.XiaOS.lock(); });
    document.getElementById('smPowerRestart').addEventListener('click', () => { close(); window.XiaOS.restart(); });
    document.getElementById('smPowerShutdown').addEventListener('click', () => { close(); window.XiaOS.shutdown(); });
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('startmenu');
      if(menu.classList.contains('open') && !safeClosest(e.target, '#startmenu') && !safeClosest(e.target, '#tbStart')) close();
    });
    document.addEventListener('wm:open', (e) => trackRecent(e.detail.appId));
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
  }

  return { init, open, close, toggle, focusSearch };
})();
