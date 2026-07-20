/* ============================================================
   XiaOS — wm.js
   Core window manager. Framework-free: plain DOM + pointer events.
   Dispatches CustomEvents on document so taskbar/startmenu/etc can
   react without a hard dependency on this file's internals:
     wm:open   { detail: winObj }
     wm:close  { detail: { id } }
     wm:focus  { detail: { id } }
     wm:minimize / wm:restore  { detail: { id } }
     wm:title  { detail: { id, title } }
   ============================================================ */

const WM = (() => {
  const windows = new Map(); // id -> winObj
  let zTop = 100;
  let idSeq = 1;
  let layer, desktop;

  function init(){
    layer = document.getElementById('windows-layer');
    desktop = document.getElementById('desktop');
  }

  function desktopRect(){
    return desktop.getBoundingClientRect();
  }

  function iconSpan(svg){
    const s = el('span', { class: 'xwin-ttl-icon', html: svg || '' });
    return s;
  }

  function open(opts){
    // opts: {appId, title, icon(svg str), accent, width, height, x, y, singleton, render(bodyEl, win), noPad, minWidth, minHeight, resizable}
    if(opts.singleton){
      for(const w of windows.values()){
        if(w.appId === opts.appId){ focus(w.id); if(w.minimized) restore(w.id); return w; }
      }
    }
    const id = 'w' + (idSeq++);
    const rect = desktopRect();
    const width = Math.min(opts.width || 620, rect.width - 40);
    const height = Math.min(opts.height || 440, rect.height - 40);
    const cascade = (windows.size % 6) * 26;
    const x = opts.x !== undefined ? opts.x : Math.max(20, Math.round((rect.width - width) / 2 + cascade - 60));
    const y = opts.y !== undefined ? opts.y : Math.max(16, Math.round((rect.height - height) / 2 + cascade - 60) - 20);

    const winEl = el('div', {
      class: 'xwin ' + (opts.accent === 'copper' ? 'copper' : 'cyan'),
      style: `width:${width}px;height:${height}px;left:${x}px;top:${y}px;z-index:${++zTop};`,
      'data-id': id,
    });

    const titlebar = el('div', { class: 'xwin-titlebar' }, [
      iconSpan(opts.icon),
      el('span', { class: 'xwin-ttl-text' }, opts.title || 'Untitled'),
      el('div', { class: 'xwin-btns' }, [
        btn('minimize', ICONS.min, () => minimize(id)),
        btn('maximize', ICONS.max, () => toggleMaximize(id)),
        btn('close', ICONS.close, () => close(id)),
      ]),
    ]);

    const body = el('div', { class: 'xwin-body' + (opts.noPad ? ' no-pad' : '') });
    winEl.appendChild(titlebar);
    winEl.appendChild(body);

    if(opts.resizable !== false){
      ['n','s','e','w','ne','nw','se','sw'].forEach(dir => {
        winEl.appendChild(el('div', { class: 'xwin-resize ' + dir, 'data-dir': dir }));
      });
    }

    layer.appendChild(winEl);

    const winObj = {
      id, appId: opts.appId, el: winEl, body, title: opts.title,
      minimized: false, maximized: false, restoreRect: null,
      minWidth: opts.minWidth || 320, minHeight: opts.minHeight || 220,
      accent: opts.accent === 'copper' ? 'copper' : 'cyan', icon: opts.icon,
      onClose: opts.onClose, cleanup: null,
    };
    windows.set(id, winObj);

    // wire dragging
    wireDrag(winObj, titlebar);
    if(opts.resizable !== false) wireResize(winObj);
    winEl.addEventListener('mousedown', () => focus(id));
    titlebar.addEventListener('dblclick', (e) => { if(e.target === titlebar || e.target.classList.contains('xwin-ttl-text')) toggleMaximize(id); });

    if(typeof opts.render === 'function') opts.render(body, winObj);

    focus(id);
    document.dispatchEvent(new CustomEvent('wm:open', { detail: winObj }));
    return winObj;
  }

  function btn(cls, svg, handler){
    const b = el('button', { class: 'xwin-btn ' + cls, html: svg, type: 'button' });
    b.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
    return b;
  }

  function focus(id){
    const w = windows.get(id);
    if(!w) return;
    windows.forEach(o => o.el.classList.remove('focused'));
    w.el.classList.add('focused');
    w.el.style.zIndex = ++zTop;
    document.dispatchEvent(new CustomEvent('wm:focus', { detail: { id } }));
  }

  function getFocused(){
    for(const w of windows.values()) if(w.el.classList.contains('focused')) return w;
    return null;
  }

  function setTitle(id, title){
    const w = windows.get(id);
    if(!w) return;
    w.title = title;
    const t = w.el.querySelector('.xwin-ttl-text');
    if(t) t.textContent = title;
    document.dispatchEvent(new CustomEvent('wm:title', { detail: { id, title } }));
  }

  function minimize(id){
    const w = windows.get(id);
    if(!w) return;
    w.minimized = true;
    w.el.classList.add('minimized');
    document.dispatchEvent(new CustomEvent('wm:minimize', { detail: { id } }));
  }

  function restore(id){
    const w = windows.get(id);
    if(!w) return;
    w.minimized = false;
    w.el.classList.remove('minimized');
    focus(id);
    document.dispatchEvent(new CustomEvent('wm:restore', { detail: { id } }));
  }

  function toggleMinimizeFromTaskbar(id){
    const w = windows.get(id);
    if(!w) return;
    const isFocused = w.el.classList.contains('focused');
    if(w.minimized) restore(id);
    else if(isFocused) minimize(id);
    else focus(id);
  }

  function applyRect(w, rect){
    w.el.style.left = rect.left + 'px';
    w.el.style.top = rect.top + 'px';
    w.el.style.width = rect.width + 'px';
    w.el.style.height = rect.height + 'px';
  }

  function toggleMaximize(id){
    const w = windows.get(id);
    if(!w) return;
    if(w.maximized){
      w.maximized = false;
      w.el.classList.remove('maximized');
      if(w.restoreRect) applyRect(w, w.restoreRect);
    } else {
      const r = desktopRect();
      w.restoreRect = {
        left: parseInt(w.el.style.left, 10), top: parseInt(w.el.style.top, 10),
        width: parseInt(w.el.style.width, 10), height: parseInt(w.el.style.height, 10),
      };
      w.maximized = true;
      w.el.classList.add('maximized');
      applyRect(w, { left: 0, top: 0, width: r.width, height: r.height });
    }
    focus(id);
  }

  function snapLeftHalf(id){ snapRect(id, 'left'); }
  function snapRightHalf(id){ snapRect(id, 'right'); }
  function snapRect(id, side){
    const w = windows.get(id);
    if(!w) return;
    const r = desktopRect();
    w.maximized = false;
    w.el.classList.remove('maximized');
    const rect = side === 'left'
      ? { left: 0, top: 0, width: Math.round(r.width / 2), height: r.height }
      : { left: Math.round(r.width / 2), top: 0, width: Math.round(r.width / 2), height: r.height };
    applyRect(w, rect);
    focus(id);
  }

  function close(id){
    const w = windows.get(id);
    if(!w) return;
    if(typeof w.cleanup === 'function'){ try{ w.cleanup(); } catch(e){} }
    if(typeof w.onClose === 'function'){ try{ w.onClose(); } catch(e){} }
    w.el.remove();
    windows.delete(id);
    document.dispatchEvent(new CustomEvent('wm:close', { detail: { id } }));
  }

  function closeAll(){
    Array.from(windows.keys()).forEach(close);
  }

  function minimizeAll(){
    windows.forEach(w => { if(!w.minimized) minimize(w.id); });
  }

  function list(){ return Array.from(windows.values()); }

  /* ---------- dragging ---------- */
  const snapPreview = () => document.getElementById('snap-preview');

  function wireDrag(w, handleEl){
    let dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
    let snapZone = null;

    handleEl.addEventListener('pointerdown', (e) => {
      if(safeClosest(e.target, '.xwin-btn')) return;
      dragging = true;
      handleEl.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY;
      origLeft = parseInt(w.el.style.left, 10) || 0;
      origTop = parseInt(w.el.style.top, 10) || 0;
      focus(w.id);
    });
    handleEl.addEventListener('pointermove', (e) => {
      if(!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      let nx = origLeft + dx, ny = origTop + dy;
      const r = desktopRect();
      ny = Math.max(0, Math.min(ny, r.height - 30));
      nx = Math.max(-w.el.offsetWidth + 80, Math.min(nx, r.width - 80));
      if(w.maximized){
        // un-maximize while keeping cursor position proportionally
        w.maximized = false; w.el.classList.remove('maximized');
        const ratio = (e.clientX - r.left) / r.width;
        nx = e.clientX - r.left - (w.restoreRect ? w.restoreRect.width * ratio : 200);
        applyRect(w, { left: nx, top: 0, width: (w.restoreRect ? w.restoreRect.width : 600), height: (w.restoreRect ? w.restoreRect.height : 420) });
        origLeft = nx; origTop = 0; startX = e.clientX; startY = e.clientY;
        return;
      }
      w.el.style.left = nx + 'px';
      w.el.style.top = ny + 'px';

      // edge snap detection
      const relX = e.clientX - r.left;
      const sp = snapPreview();
      if(relX < 6){ snapZone = 'left'; sp.style.left = '0'; sp.style.top='0'; sp.style.width = (r.width/2)+'px'; sp.style.height = r.height+'px'; sp.classList.add('show'); }
      else if(relX > r.width - 6){ snapZone = 'right'; sp.style.left = (r.width/2)+'px'; sp.style.top='0'; sp.style.width = (r.width/2)+'px'; sp.style.height = r.height+'px'; sp.classList.add('show'); }
      else if((e.clientY - r.top) < 4){ snapZone = 'max'; sp.style.left='0'; sp.style.top='0'; sp.style.width=r.width+'px'; sp.style.height=r.height+'px'; sp.classList.add('show'); }
      else { snapZone = null; sp.classList.remove('show'); }
    });
    function endDrag(e){
      if(!dragging) return;
      dragging = false;
      try{ handleEl.releasePointerCapture(e.pointerId); }catch(err){}
      const sp = snapPreview(); sp.classList.remove('show');
      if(snapZone === 'left') snapLeftHalf(w.id);
      else if(snapZone === 'right') snapRightHalf(w.id);
      else if(snapZone === 'max') toggleMaximize(w.id);
      snapZone = null;
    }
    handleEl.addEventListener('pointerup', endDrag);
    handleEl.addEventListener('pointercancel', endDrag);
  }

  /* ---------- resizing ---------- */
  function wireResize(w){
    const handles = qsa('.xwin-resize', w.el);
    handles.forEach(h => {
      const dir = h.dataset.dir;
      h.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        h.setPointerCapture(e.pointerId);
        const startX = e.clientX, startY = e.clientY;
        const orig = { left: parseInt(w.el.style.left,10), top: parseInt(w.el.style.top,10), width: w.el.offsetWidth, height: w.el.offsetHeight };
        focus(w.id);
        function onMove(ev){
          const dx = ev.clientX - startX, dy = ev.clientY - startY;
          let { left, top, width, height } = orig;
          if(dir.includes('e')) width = Math.max(w.minWidth, orig.width + dx);
          if(dir.includes('s')) height = Math.max(w.minHeight, orig.height + dy);
          if(dir.includes('w')){ width = Math.max(w.minWidth, orig.width - dx); left = orig.left + (orig.width - width); }
          if(dir.includes('n')){ height = Math.max(w.minHeight, orig.height - dy); top = orig.top + (orig.height - height); }
          w.el.style.left = left + 'px'; w.el.style.top = top + 'px';
          w.el.style.width = width + 'px'; w.el.style.height = height + 'px';
        }
        function onUp(ev){
          h.releasePointerCapture(ev.pointerId);
          h.removeEventListener('pointermove', onMove);
          h.removeEventListener('pointerup', onUp);
        }
        h.addEventListener('pointermove', onMove);
        h.addEventListener('pointerup', onUp);
      });
    });
  }

  const ICONS = {
    min: '<svg viewBox="0 0 12 12" fill="none"><line x1="1" y1="10" x2="11" y2="10" stroke="currentColor" stroke-width="1.4"/></svg>',
    max: '<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>',
    close: '<svg viewBox="0 0 12 12" fill="none"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="1.5"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  };

  return { init, open, focus, getFocused, setTitle, minimize, restore, toggleMinimizeFromTaskbar, toggleMaximize, close, closeAll, minimizeAll, list, windows };
})();
