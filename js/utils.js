/* ============================================================
   XiaOS — utils.js
   ============================================================ */

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s === null || s === undefined ? '' : String(s);
  return d.innerHTML;
}

function formatTime(s){
  if(!isFinite(s) || s === null) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

function el(tag, attrs, children){
  const e = document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k === 'class') e.className = attrs[k];
    else if(k === 'html') e.innerHTML = attrs[k];
    else if(k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if(children) (Array.isArray(children) ? children : [children]).forEach(c => {
    if(c === null || c === undefined) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

/* ---------- toast (legacy easter-egg style, small + centered) ---------- */
let toastTimer = null;
function showToast(msg, ms){
  const toastEl = document.getElementById('toast');
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 2600);
}

/* ---------- notification stack (Windows-style toast cards) ---------- */
function showNotification(title, body, accent){
  const stack = document.getElementById('notif-stack');
  if(!stack) return;
  const n = el('div', { class: 'notif' + (accent === 'copper' ? ' copper' : '') }, [
    el('div', { class: 'notif-title' }, title),
    el('div', { class: 'notif-body' }, body),
  ]);
  stack.appendChild(n);
  setTimeout(() => {
    n.style.transition = 'opacity .25s, transform .25s';
    n.style.opacity = '0';
    n.style.transform = 'translateX(24px)';
    setTimeout(() => n.remove(), 260);
  }, 4600);
}

/* ---------- clock ---------- */
function pad2(n){ return String(n).padStart(2, '0'); }
function nowTimeStr(){
  const d = new Date();
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if(h === 0) h = 12;
  return h + ':' + pad2(d.getMinutes()) + ' ' + ampm;
}
function nowDateStr(){
  const d = new Date();
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}
function nowDateLongStr(){
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = new Date();
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
}

const SS = {
  get(key, fallback){
    try{ const v = sessionStorage.getItem(key); return v === null ? (fallback === undefined ? null : fallback) : v; }
    catch(e){ return fallback === undefined ? null : fallback; }
  },
  set(key, value){
    try{ sessionStorage.setItem(key, value); return true; }
    catch(e){ return false; }
  },
  remove(key){
    try{ sessionStorage.removeItem(key); }catch(e){}
  },
};

/* ---------- clipboard (navigator.clipboard isn't always available, e.g. non-https) ---------- */
function copyText(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}
function fallbackCopy(text){
  return new Promise((resolve, reject) => {
    try{
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      ok ? resolve() : reject(new Error('copy failed'));
    }catch(e){ reject(e); }
  });
}

/* ---------- shared right-click context menu ---------- */
const ContextMenu = {
  open(x, y, items){
    const m = document.getElementById('ctxmenu');
    m.innerHTML = '';
    items.forEach(it => {
      if(it === 'sep'){ m.appendChild(el('div', { class: 'ctx-sep' })); return; }
      const row = el('div', { class: 'ctx-item' }, [el('span', { html: it.icon || '' }), el('span', {}, it.label)]);
      row.addEventListener('click', () => { ContextMenu.close(); it.handler(); });
      m.appendChild(row);
    });
    const rect = document.getElementById('desktop').getBoundingClientRect();
    const mw = 220, mh = Math.min(320, items.length * 36 + 20);
    let left = x, top = y;
    if(left + mw > rect.right) left = rect.right - mw - 6;
    if(top + mh > rect.bottom + 46) top = rect.bottom + 46 - mh - 6;
    m.style.left = left + 'px'; m.style.top = top + 'px';
    m.classList.add('open');
  },
  close(){ const m = document.getElementById('ctxmenu'); if(m) m.classList.remove('open'); },
};

/* ---------- tiny query helper ---------- */
function qs(sel, root){ return (root || document).querySelector(sel); }
function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
function safeClosest(t, sel){ return (t && typeof t.closest === 'function') ? t.closest(sel) : null; }

/* ---------- safe localStorage (private browsing / opaque origins can throw) ---------- */
const LS = {
  get(key, fallback){
    try{ const v = localStorage.getItem(key); return v === null ? (fallback === undefined ? null : fallback) : v; }
    catch(e){ return fallback === undefined ? null : fallback; }
  },
  set(key, value){
    try{ localStorage.setItem(key, value); return true; }
    catch(e){ return false; }
  },
  remove(key){
    try{ localStorage.removeItem(key); }catch(e){}
  },
};
