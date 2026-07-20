/* ============================================================
   XiaOS — apps/taskmgr.js
   Windows-Task-Manager-style app. The "System" processes are
   pure flavor, but the app windows listed are real — End Task
   actually calls WM.close(). Ctrl+Shift+Esc opens it, same as
   the real thing.
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

const FAKE_PROCS = [
  { name: 'System Idle Process', baseCpu: 58, baseMem: 4, endable: false },
  { name: 'xwm.exe — Window Manager', baseCpu: 2.4, baseMem: 46, endable: false },
  { name: 'desktop-shell.exe', baseCpu: 1.1, baseMem: 58, endable: false },
  { name: 'boot-daemon.exe', baseCpu: 0.2, baseMem: 11, endable: false },
  { name: 'copper-trace-lan.sys', baseCpu: 0.6, baseMem: 7, endable: false },
  { name: 'matrix-rain.exe', baseCpu: 13, baseMem: 24, endable: true, onlyIf: () => !!window.matrixOn, joke: "can't end this one — it's load-bearing. try the matrix tray icon instead." },
  { name: 'audio-engine.sys', baseCpu: 4.2, baseMem: 33, onlyIf: () => Apps.playlist && Apps.playlist.isPlaying(), endable: true, joke: 'pause the Playlist app instead — this one just follows orders.' },
];

function rnd(base, spread){ return Math.max(0.1, base + (Math.random() * spread * 2 - spread)); }
function clampPct(n){ return Math.min(99.9, Math.max(0.1, n)); }

function buildProcessRows(){
  const rows = [];
  FAKE_PROCS.forEach(p => {
    if(p.onlyIf && !p.onlyIf()) return;
    rows.push({ id: 'fake:' + p.name, name: p.name, cpu: clampPct(rnd(p.baseCpu, p.baseCpu * 0.25 + 0.4)), mem: Math.round(rnd(p.baseMem, p.baseMem * 0.15 + 1)), endable: !!p.endable, joke: p.joke, real: false });
  });
  WM.list().forEach(w => {
    rows.push({ id: w.id, name: (w.title || w.appId), cpu: clampPct(rnd(3.5, 3)), mem: Math.round(rnd(70, 25)), endable: true, real: true });
  });
  rows.sort((a, b) => b.cpu - a.cpu);
  return rows;
}

/* ---------------- performance graphs ---------------- */
function makeSeries(seed){
  const arr = [];
  let v = seed;
  for(let i = 0; i < 60; i++){ v = Math.min(92, Math.max(4, v + (Math.random() * 14 - 7))); arr.push(v); }
  return arr;
}
const series = { cpu: makeSeries(22), mem: makeSeries(38), net: makeSeries(15) };

function stepSeries(key, drift){
  const arr = series[key];
  const last = arr[arr.length - 1];
  const next = Math.min(96, Math.max(3, last + (Math.random() * 16 - 8) + drift));
  arr.push(next);
  if(arr.length > 60) arr.shift();
  return next;
}

function drawGraph(canvas, data, color){
  if(!canvas) return;
  const ctx = canvas.getContext && canvas.getContext('2d');
  if(!ctx) return;
  const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  const h = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for(let i = 1; i < 4; i++){
    const y = (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  if(!data.length) return;
  const stepX = w / (data.length - 1 || 1);
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * stepX, y = h - (v / 100) * h;
    if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6 * (window.devicePixelRatio || 1);
  ctx.stroke();
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ',0.14)');
  ctx.fill();
}

function buildTaskmgr(body, win){
  body.innerHTML = `
    <div class="tm-wrap">
      <div class="pf-tabbar" id="tmTabs">
        <button class="pf-tab active" data-tab="processes" type="button"><span class="pf-tab-icon">${APPICON.apps}</span>Processes</button>
        <button class="pf-tab" data-tab="performance" type="button"><span class="pf-tab-icon">${APPICON.activity}</span>Performance</button>
      </div>
      <div class="tm-summary" id="tmSummary"></div>
      <div class="tm-panel" id="tmPanelProcesses">
        <div class="tm-table">
          <div class="tm-row tm-head">
            <span class="tm-col-name">Name</span><span class="tm-col-status">Status</span>
            <span class="tm-col-cpu">CPU</span><span class="tm-col-mem">Memory</span><span class="tm-col-action"></span>
          </div>
          <div id="tmRows"></div>
        </div>
      </div>
      <div class="tm-panel" id="tmPanelPerformance" style="display:none;">
        <div class="tm-perf-grid">
          <div class="tm-perf-card"><div class="tm-perf-head"><span>CPU</span><span class="tm-perf-value" id="tmCpuVal">0%</span></div><canvas id="tmCpuCanvas" class="tm-perf-canvas"></canvas></div>
          <div class="tm-perf-card"><div class="tm-perf-head"><span>Memory</span><span class="tm-perf-value" id="tmMemVal">0%</span></div><canvas id="tmMemCanvas" class="tm-perf-canvas"></canvas></div>
          <div class="tm-perf-card"><div class="tm-perf-head"><span>Network — Copper Trace LAN</span><span class="tm-perf-value" id="tmNetVal">0%</span></div><canvas id="tmNetCanvas" class="tm-perf-canvas"></canvas></div>
        </div>
      </div>
    </div>`;

  let activeTab = 'processes';
  qsa('.pf-tab', body).forEach(t => t.addEventListener('click', () => {
    activeTab = t.dataset.tab;
    qsa('.pf-tab', body).forEach(x => x.classList.toggle('active', x === t));
    qs('#tmPanelProcesses', body).style.display = activeTab === 'processes' ? '' : 'none';
    qs('#tmPanelPerformance', body).style.display = activeTab === 'performance' ? '' : 'none';
    renderTick();
  }));

  function endProcess(row){
    if(!row.endable){ showToast("can't end a core system process — XiaOS would fall over."); return; }
    if(row.joke){ showToast(row.joke); return; }
    if(row.real) WM.close(row.id);
    renderTick();
  }

  function renderRows(){
    const host = qs('#tmRows', body);
    if(!host) return;
    const rows = buildProcessRows();
    host.innerHTML = '';
    rows.forEach(row => {
      const isTaskmgrItself = row.id === win.id;
      const rowEl = el('div', { class: 'tm-row' }, [
        el('span', { class: 'tm-col-name' }, row.name + (isTaskmgrItself ? ' (this window)' : '')),
        el('span', { class: 'tm-col-status' }, row.real ? 'Running' : 'System'),
        el('span', { class: 'tm-col-cpu' }, row.cpu.toFixed(1) + '%'),
        el('span', { class: 'tm-col-mem' }, row.mem + ' MB'),
      ]);
      const actionCell = el('span', { class: 'tm-col-action' });
      if(row.endable){
        const btn = el('button', { class: 'tm-endtask', type: 'button' }, 'End Task');
        btn.addEventListener('click', () => endProcess(row));
        actionCell.appendChild(btn);
      }
      rowEl.appendChild(actionCell);
      rowEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        ContextMenu.open(e.clientX, e.clientY, [
          { label: 'End Task', icon: APPICON.close, handler: () => endProcess(row) },
          { label: 'Properties', icon: APPICON.info, handler: () => showToast(row.name + ' — ' + row.cpu.toFixed(1) + '% CPU, ' + row.mem + ' MB') },
        ]);
      });
      host.appendChild(rowEl);
    });
    const totalCpu = Math.min(100, rows.reduce((s, r) => s + r.cpu, 0) / Math.max(1, rows.length) * 1.4);
    const totalMem = rows.reduce((s, r) => s + r.mem, 0);
    qs('#tmSummary', body).innerHTML =
      `<span>${rows.length} processes</span><span>${totalCpu.toFixed(0)}% CPU</span><span>${totalMem} MB memory</span><span>Uptime: ${uptimeShort()}</span>`;
  }

  function uptimeShort(){
    const ms = Date.now() - (window.XIAOS_BOOT_TIME || Date.now());
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  }

  function renderPerf(){
    const cpu = stepSeries('cpu', window.matrixOn ? 2 : -0.5);
    const mem = stepSeries('mem', 0.1);
    const net = stepSeries('net', (Apps.playlist && Apps.playlist.isPlaying()) ? 3 : -1);
    qs('#tmCpuVal', body).textContent = cpu.toFixed(0) + '%';
    qs('#tmMemVal', body).textContent = mem.toFixed(0) + '%';
    qs('#tmNetVal', body).textContent = net.toFixed(0) + '%';
    if(activeTab === 'performance'){
      drawGraph(qs('#tmCpuCanvas', body), series.cpu, 'rgb(255,157,92)');
      drawGraph(qs('#tmMemCanvas', body), series.mem, 'rgb(110,231,216)');
      drawGraph(qs('#tmNetCanvas', body), series.net, 'rgb(255,157,92)');
    }
  }

  function renderTick(){ renderRows(); renderPerf(); }

  renderTick();
  const iv = setInterval(renderTick, 1300);
  win.cleanup = () => clearInterval(iv);
}

Apps.taskmgr = {
  id: 'taskmgr', title: 'Task Manager', icon: APPICON.activity, accent: 'copper',
  open(){
    return WM.open({
      appId: 'taskmgr', title: 'Task Manager', icon: APPICON.activity, accent: 'copper',
      width: 620, height: 480, minWidth: 480, minHeight: 340, singleton: true, noPad: true,
      render: buildTaskmgr,
    });
  },
};

/* Ctrl+Shift+Esc — same shortcut as the real thing */
document.addEventListener('keydown', (e) => {
  if(e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'Esc')){
    if(!document.getElementById('boot').classList.contains('done')) return;
    e.preventDefault();
    Apps.taskmgr.open();
  }
});
})();
