/* ============================================================
   XiaOS — apps/explorer.js
   A small virtual filesystem representing the site's content:
   Documents (the old terminal fileSystem), Music (tracks.json),
   Pictures (game logos), Projects (builds.json as shortcuts).
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

function buildVFS(){
  const documents = { type: 'folder', label: 'Documents', children: {} };
  Object.keys(TERMINAL_FILES).forEach(name => {
    documents.children[name] = { type: 'file', subtype: 'text', label: name, content: TERMINAL_FILES[name] };
  });

  const music = { type: 'folder', label: 'Music', children: {} };
  (typeof TRACKS !== 'undefined' ? TRACKS : TRACKS_FALLBACK).forEach(t => {
    const label = (t.title || t.file).replace(/[\\/]/g, '-');
    music.children[label] = { type: 'file', subtype: 'audio', label, file: t.file, sub: t.artist || '' };
  });

  const pictures = { type: 'folder', label: 'Pictures', children: {
    'Minecraft_logo.svg': { type: 'file', subtype: 'image', label: 'Minecraft_logo.svg', src: 'assets/Minecraft_logo.svg' },
    'Deltarune_logo.svg': { type: 'file', subtype: 'image', label: 'Deltarune_logo.svg', src: 'assets/Deltarune_logo.svg' },
    'Ultrakill_logo.svg': { type: 'file', subtype: 'image', label: 'Ultrakill_logo.svg', src: 'assets/Ultrakill_logo.svg' },
  }};

  const projects = { type: 'folder', label: 'Projects', children: {} };
  (typeof LIVE_BUILDS !== 'undefined' ? LIVE_BUILDS : BUILDS).forEach(p => {
    projects.children[p.title] = { type: 'file', subtype: 'link', label: p.title, url: p.url, sub: p.status };
  });

  const desktop = { type: 'folder', label: 'Desktop', children: {
    'Portfolio.app': { type: 'file', subtype: 'app', label: 'Portfolio.app', appId: 'portfolio' },
    'Terminal.app': { type: 'file', subtype: 'app', label: 'Terminal.app', appId: 'terminal' },
    'TaskManager.app': { type: 'file', subtype: 'app', label: 'TaskManager.app', appId: 'taskmgr' },
  }};

  return {
    type: 'folder', label: 'This PC', children: { Desktop: desktop, Documents: documents, Music: music, Pictures: pictures, Projects: projects },
  };
}

const FILE_ICON = { text: APPICON.fileText, audio: APPICON.fileAudio, image: APPICON.fileImage, link: APPICON.external, app: APPICON.terminal };

function buildExplorer(body, win){
  let vfs = buildVFS();
  let path = []; // array of keys from root
  let history = [[]];
  let histIndex = 0;
  let viewingFile = null;

  body.innerHTML = `
    <div class="explorer">
      <div class="explorer-toolbar">
        <button id="expBack" title="Back">${APPICON.back}</button>
        <button id="expFwd" title="Forward">${APPICON.fwd}</button>
        <button id="expUp" title="Up">${APPICON.up}</button>
        <div class="explorer-path" id="expPath"></div>
        <button id="expRefresh" title="Refresh">${APPICON.refresh}</button>
      </div>
      <div class="explorer-main">
        <div class="explorer-sidebar" id="expSidebar"></div>
        <div class="explorer-files" id="expFiles"></div>
      </div>
    </div>`;

  const sidebar = qs('#expSidebar', body);
  const filesEl = qs('#expFiles', body);
  const pathEl = qs('#expPath', body);
  const backBtn = qs('#expBack', body), fwdBtn = qs('#expFwd', body), upBtn = qs('#expUp', body);

  const QUICK_ACCESS = [
    { path: [], label: 'This PC', icon: APPICON.thispc },
    { path: ['Desktop'], label: 'Desktop', icon: APPICON.folder },
    { path: ['Documents'], label: 'Documents', icon: APPICON.folder },
    { path: ['Music'], label: 'Music', icon: APPICON.folder },
    { path: ['Pictures'], label: 'Pictures', icon: APPICON.folder },
    { path: ['Projects'], label: 'Projects', icon: APPICON.folder },
  ];

  function renderSidebar(){
    sidebar.innerHTML = '';
    sidebar.appendChild(el('div', { class: 'exp-side-label' }, 'Quick access'));
    QUICK_ACCESS.forEach(q => {
      const same = JSON.stringify(q.path) === JSON.stringify(path);
      const item = el('div', { class: 'exp-side-item' + (same ? ' active' : '') }, [
        el('span', { html: q.icon }), el('span', {}, q.label),
      ]);
      item.addEventListener('click', () => navigateTo(q.path));
      sidebar.appendChild(item);
    });
  }

  function getNode(p){
    let node = vfs;
    for(const key of p){
      if(!node.children || !node.children[key]) return null;
      node = node.children[key];
    }
    return node;
  }

  function renderPath(){
    const crumbs = ['This PC', ...path];
    pathEl.innerHTML = '<b>' + crumbs.map(escapeHtml).join(' \u203a ') + '</b>';
    backBtn.disabled = histIndex <= 0;
    fwdBtn.disabled = histIndex >= history.length - 1;
    upBtn.disabled = path.length === 0;
  }

  function openFile(node){
    if(node.subtype === 'text' || node.subtype === 'image'){ viewingFile = { node }; renderFiles(); return; }
    if(node.subtype === 'audio'){
      if(Apps.playlist && Apps.playlist.playFile(node.file)) showNotification('Now playing', node.label, 'cyan');
      else showToast("couldn't find that track");
      return;
    }
    if(node.subtype === 'link'){ window.open(node.url, '_blank', 'noopener'); return; }
    if(node.subtype === 'app'){ if(Apps[node.appId]) Apps[node.appId].open(); return; }
  }

  function renderFiles(){
    filesEl.innerHTML = '';
    if(viewingFile){
      const back = el('span', { class: 'exp-viewer-back' }, '\u2039 back to files');
      back.addEventListener('click', () => { viewingFile = null; renderFiles(); });
      const viewer = el('div', { class: 'exp-viewer' });
      viewer.appendChild(back);
      if(viewingFile.node.subtype === 'text'){
        viewer.appendChild(el('div', {}, viewingFile.node.content));
      } else if(viewingFile.node.subtype === 'image'){
        viewer.appendChild(el('div', { style: 'display:flex;align-items:center;justify-content:center;padding:30px 0;' },
          el('img', { src: viewingFile.node.src, style: 'max-width:220px;max-height:220px;' })));
      }
      filesEl.appendChild(viewer);
      return;
    }
    const node = getNode(path);
    if(!node || !node.children || !Object.keys(node.children).length){
      filesEl.appendChild(el('p', { class: 'exp-empty' }, 'This folder is empty.'));
      return;
    }
    const grid = el('div', { class: 'exp-grid' });
    Object.keys(node.children).forEach(key => {
      const child = node.children[key];
      const icon = child.type === 'folder' ? APPICON.folder : (FILE_ICON[child.subtype] || APPICON.fileText);
      const item = el('div', { class: 'exp-file' }, [
        el('span', { html: icon }),
        el('span', { class: 'ef-label' }, child.label),
        child.sub ? el('span', { class: 'ef-meta' }, child.sub) : null,
      ]);
      item.addEventListener('dblclick', () => { if(child.type === 'folder') navigateTo([...path, key]); else openFile(child); });
      item.addEventListener('click', () => { qsa('.exp-file', grid).forEach(f => f.style.background = ''); item.style.background = 'rgba(255,255,255,0.06)'; });
      grid.appendChild(item);
    });
    filesEl.appendChild(grid);
  }

  function navigateTo(p, push){
    path = p; viewingFile = null;
    if(push !== false){
      history = history.slice(0, histIndex + 1);
      history.push(p);
      histIndex = history.length - 1;
    }
    renderSidebar(); renderPath(); renderFiles();
  }

  backBtn.addEventListener('click', () => { if(histIndex > 0){ histIndex--; navigateTo(history[histIndex], false); } });
  fwdBtn.addEventListener('click', () => { if(histIndex < history.length - 1){ histIndex++; navigateTo(history[histIndex], false); } });
  upBtn.addEventListener('click', () => { if(path.length) navigateTo(path.slice(0, -1)); });
  qs('#expRefresh', body).addEventListener('click', () => { vfs = buildVFS(); renderFiles(); });

  navigateTo([]);

  const onDataUpdate = () => { vfs = buildVFS(); renderFiles(); };
  document.addEventListener('tracks-updated', onDataUpdate);
  document.addEventListener('builds-updated', onDataUpdate);
  win.cleanup = () => { document.removeEventListener('tracks-updated', onDataUpdate); document.removeEventListener('builds-updated', onDataUpdate); };
}

Apps.explorer = {
  id: 'explorer', title: 'File Explorer', icon: APPICON.explorer, accent: 'cyan',
  open(){
    return WM.open({
      appId: 'explorer', title: 'File Explorer', icon: APPICON.explorer, accent: 'cyan',
      width: 640, height: 460, singleton: true, noPad: true,
      render: buildExplorer,
    });
  },
};
})();
