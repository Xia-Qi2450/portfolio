/* ============================================================
   XiaOS — apps/portfolio.js
   Home, Stack, Builds, Off Duty, and Connect — all the original
   site's "pages" (everything except the music player) — merged
   into one window with a tab strip, instead of five separate
   taskbar entries.
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

const TABS = [
  { id: 'home', label: 'Home', icon: APPICON.home },
  { id: 'stack', label: 'Stack', icon: APPICON.stack },
  { id: 'builds', label: 'Builds', icon: APPICON.builds },
  { id: 'offduty', label: 'Off Duty', icon: APPICON.offduty },
  { id: 'connect', label: 'Connect', icon: APPICON.connect },
];

/* ---------------- Home ---------------- */
function renderHome(container, switchTab){
  container.innerHTML = `
    <div class="home-hero">
      <img class="home-avatar" id="homeAvatar" src="${XIA.avatar}" alt="Xia Qi's GitHub avatar" width="76" height="76">
      <div>
        <p class="home-prompt">whoami<span class="home-cursor"></span></p>
        <h1 class="home-h1">${XIA.name}</h1>
        <p class="home-role"><span class="sw">${XIA.role.sw}</span><span class="sep">/</span><span class="hw">${XIA.role.hw}</span></p>
        <p class="home-status"><span class="sdot"></span>status: ${escapeHtml(XIA.status)}</p>
        <p class="home-bio">${escapeHtml(XIA.bio)}</p>
        <div class="home-cta">
          <a class="btn btn-primary" href="https://github.com/${XIA.handle}" target="_blank" rel="noopener">View GitHub ↗</a>
          <button class="btn" id="homeCopyDiscord" type="button">Copy Discord: ${XIA.discord}</button>
        </div>
      </div>
    </div>
    <section>
      <p class="eyebrow">Around this OS</p>
      <div class="home-nodes" id="homeNodes"></div>
    </section>`;

  const nodes = [
    { id: 'stack', idx: '01', title: 'Stack', sub: 'Python, the web, Luau — plus Arduino, 3D printing, PC builds.', track: 'copper' },
    { id: 'builds', idx: '02', title: 'Builds', sub: 'Projects, sorted by status — from a DELTARUNE tribute to a Project Euler grind.', track: 'cyan' },
    { id: 'offduty', idx: '03', title: 'Off Duty', sub: 'Gaming, anime, and a soft spot for vocal synths.', track: 'copper' },
    { id: 'playlist', idx: '04', title: 'Playlist', sub: 'An actual audio player, wired up to /music/.', track: 'cyan', external: true },
    { id: 'connect', idx: '05', title: 'Connect', sub: 'GitHub, Discord, and a terminal only some people find.', track: 'copper' },
  ];
  const wrap = qs('#homeNodes', container);
  nodes.forEach(n => {
    const b = el('button', { class: 'home-node ' + n.track, type: 'button' }, [
      el('span', { class: 'hn-idx' }, n.idx),
      el('div', { class: 'hn-body' }, [
        el('p', { class: 'hn-title' }, n.title),
        el('p', { class: 'hn-sub' }, n.sub),
      ]),
      el('span', { class: 'hn-arrow' }, '→'),
    ]);
    b.addEventListener('click', () => n.external ? Apps.playlist.open() : switchTab(n.id));
    wrap.appendChild(b);
  });

  qs('#homeCopyDiscord', container).addEventListener('click', (e) => {
    copyText(XIA.discord).then(() => {
      const btnEl = e.currentTarget, orig = btnEl.textContent;
      btnEl.textContent = 'Copied!';
      setTimeout(() => { btnEl.textContent = orig; }, 1600);
    }).catch(() => {});
  });

  let avatarClicks = 0;
  qs('#homeAvatar', container).addEventListener('click', (e) => {
    avatarClicks++;
    e.currentTarget.style.transform = 'rotate(' + (avatarClicks * 72) + 'deg)';
    if(avatarClicks === 5){ showToast('🌀 okay, you really like clicking. hi.'); avatarClicks = 0; }
  });
}

/* ---------------- Stack ---------------- */
function renderStack(container){
  container.innerHTML = `
    <p class="eyebrow">xia_qi / stack</p>
    <h1>Stack</h1>
    <p class="lede">Two tracks, one workbench. Software on one side, making it real on the other — most projects end up touching both.</p>
    <div class="tabbar" role="tablist">
      <button class="tab active" data-tab="software" type="button">Software</button>
      <button class="tab" data-tab="hardware" type="button">Hardware</button>
    </div>
    <div class="tab-panel active" id="panel-software">
      <p class="eyebrow">Track 01</p>
      <h2 style="font-size:17px;">Software</h2>
      <p class="sub">${escapeHtml(STACK_INFO.software.blurb)}</p>
      <div class="chips" id="chipsSoftware"></div>
      <p class="sub" style="margin-top:14px;">${escapeHtml(STACK_INFO.software.extra)}</p>
    </div>
    <div class="tab-panel" id="panel-hardware">
      <p class="eyebrow">Track 02</p>
      <h2 style="font-size:17px;">Hardware &amp; Making</h2>
      <p class="sub">${escapeHtml(STACK_INFO.hardware.blurb)}</p>
      <div class="chips" id="chipsHardware"></div>
      <p class="sub" style="margin-top:14px;">${escapeHtml(STACK_INFO.hardware.extra)}</p>
    </div>`;

  const fillChips = (containerId, chips, learning) => {
    const c = qs('#' + containerId, container);
    chips.forEach(t => c.appendChild(el('span', { class: 'chip' }, t)));
    if(learning) c.appendChild(el('span', { class: 'chip learning' }, '+ always learning'));
  };
  fillChips('chipsSoftware', STACK_INFO.software.chips, true);
  fillChips('chipsHardware', STACK_INFO.hardware.chips, false);

  qsa('.tab', container).forEach(t => t.addEventListener('click', () => {
    qsa('.tab', container).forEach(x => x.classList.remove('active'));
    qsa('.tab-panel', container).forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    qs('#panel-' + t.dataset.tab, container).classList.add('active');
  }));
}

/* ---------------- Builds ---------------- */
const STATUS_META = {
  'finished':    { label: 'Finished',    barClass: '' },
  'in-progress': { label: 'In Progress', barClass: 'copper' },
  'todo':        { label: 'To-Do',       barClass: 'copper' },
};
const STATUS_ORDER = ['finished', 'in-progress', 'todo'];

function repoCard(p){
  const featured = p.featured ? el('span', { class: 'featured-badge' }, 'favorite') : null;
  const a = el('a', { class: 'repo', href: p.url, target: '_blank', rel: 'noopener', style: 'position:relative;' });
  if(featured) a.appendChild(featured);
  const nameRow = el('p', { class: 'repo-name' }, [
    document.createTextNode(p.title + ' '),
    el('span', { style: 'display:flex;gap:6px;align-items:center;' }, [
      el('span', { class: 'status-badge ' + p.status }, STATUS_META[p.status].label),
      el('span', { class: 'lang' }, p.lang || ''),
    ]),
  ]);
  a.appendChild(nameRow);
  a.appendChild(el('p', { class: 'repo-desc' }, p.desc));
  if(p.status !== 'todo'){
    a.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'progress-fill ' + STATUS_META[p.status].barClass, style: 'width:' + (p.progress || 0) + '%;' })));
    a.appendChild(el('div', { class: 'progress-label' }, [el('span', {}, (p.progress || 0) + '%'), el('span', {}, STATUS_META[p.status].label)]));
  }
  return a;
}
function renderBuildsList(root, data){
  root.innerHTML = '';
  const groups = { finished: [], 'in-progress': [], todo: [] };
  data.forEach(p => { if(groups[p.status]) groups[p.status].push(p); });
  STATUS_ORDER.forEach(status => {
    const items = groups[status];
    const section = el('div', { class: 'status-section' });
    section.appendChild(el('p', { class: 'status-section-title' }, [document.createTextNode(STATUS_META[status].label + ' '), el('span', { class: 'count' }, String(items.length))]));
    if(items.length){
      const grid = el('div', { class: 'repo-grid' });
      items.forEach(p => grid.appendChild(repoCard(p)));
      section.appendChild(grid);
    } else {
      section.appendChild(el('p', { class: 'repo-empty' }, 'nothing here yet — either I have ran out of ideas or I am too busy to think of new ideas'));
    }
    root.appendChild(section);
  });
}
function renderBuilds(container){
  container.innerHTML = `
    <p class="eyebrow">xia_qi / builds</p>
    <h1>Builds</h1>
    <p class="lede">Sorted by status, not by date. Data lives in <code>builds.json</code>.</p>
    <div id="buildsRoot"></div>`;
  const root = qs('#buildsRoot', container);
  renderBuildsList(root, typeof LIVE_BUILDS !== 'undefined' ? LIVE_BUILDS : BUILDS);
  const onUpdate = () => renderBuildsList(root, LIVE_BUILDS);
  document.addEventListener('builds-updated', onUpdate);
  return () => document.removeEventListener('builds-updated', onUpdate);
}

/* ---------------- Off Duty ---------------- */
function simpleList(items){
  if(!items || !items.length) return '<p class="repo-empty">nothing here yet</p>';
  return '<ul class="anime-list">' + items.map(a =>
    '<li class="anime-item"><p class="anime-title">' + escapeHtml(a.title) + '</p>' +
    (a.note ? '<p class="anime-note">' + escapeHtml(a.note) + '</p>' : '') + '</li>'
  ).join('') + '</ul>';
}
function bingingList(items){
  if(!items || !items.length) return '<p class="repo-empty">nothing here yet</p>';
  return '<ul class="anime-list">' + items.map(a =>
    '<li class="anime-item"><p class="anime-title">' + escapeHtml(a.title) + '</p>' +
    (a.note ? '<p class="anime-note">' + escapeHtml(a.note) + '</p>' : '') +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + (a.progress || 0) + '%;"></div></div>' +
    '<div class="progress-label"><span>' + (a.progress || 0) + '%</span><span>binging</span></div></li>'
  ).join('') + '</ul>';
}
function renderAnime(root, data){
  root.innerHTML =
    '<div class="status-section"><p class="status-section-title">On My Watchlist <span class="count">' + ((data.watchlist||[]).length) + '</span></p>' + simpleList(data.watchlist) + '</div>' +
    '<div class="status-section"><p class="status-section-title">Currently Binging <span class="count">' + ((data.binging||[]).length) + '</span></p>' + bingingList(data.binging) + '</div>' +
    '<div class="status-section"><p class="status-section-title">Completed <span class="count">' + ((data.completed||[]).length) + '</span></p>' + simpleList(data.completed) + '</div>';
}
function renderOffDuty(container){
  container.innerHTML = `
    <p class="eyebrow">xia_qi / off-duty</p>
    <h1>Off Duty</h1>
    <p class="lede">When the IDE's closed, it's usually one of these — sometimes all four at once.</p>
    <section>
      <p class="eyebrow">Gaming</p>
      <h2 style="font-size:16px;">Current favorites</h2>
      <div class="game-grid" id="gameGrid"></div>
    </section>
    <section>
      <p class="eyebrow">Anime</p>
      <h2 style="font-size:16px;">Watchlist tracker</h2>
      <p class="sub">Data lives in <code>anime.json</code>.</p>
      <div id="animeRoot"></div>
    </section>
    <section>
      <p class="eyebrow">Vocal Synth</p>
      <h2 style="font-size:16px;">Hatsune Miku &amp; Kasane Teto</h2>
      <p class="sub">Click a name to expand.</p>
      <div id="vocalAccordion"></div>
    </section>
    <section>
      <p class="eyebrow">Soundtracks</p>
      <h2 style="font-size:16px;">On repeat right now</h2>
      <div class="ost-list" id="ostList"></div>
    </section>`;

  const gameGrid = qs('#gameGrid', container);
  OFFDUTY.games.forEach(g => {
    gameGrid.appendChild(el('div', { class: 'game-card' }, [
      el('div', { class: 'game-cover ' + g.cls }, el('img', { src: g.logo, alt: g.title + ' logo' })),
      el('div', { class: 'game-info' }, [
        el('p', { class: 'game-title' }, g.title),
        el('p', { class: 'game-genre' }, g.genre),
        el('p', { class: 'game-desc' }, g.desc),
      ]),
    ]));
  });

  const animeRoot = qs('#animeRoot', container);
  renderAnime(animeRoot, typeof LIVE_ANIME !== 'undefined' ? LIVE_ANIME : ANIME);
  const onAnimeUpdate = () => renderAnime(animeRoot, LIVE_ANIME);
  document.addEventListener('anime-updated', onAnimeUpdate);

  const acc = qs('#vocalAccordion', container);
  OFFDUTY.vocalSynth.forEach(v => {
    const item = el('div', { class: 'accordion-item' });
    const header = el('button', { class: 'accordion-header', type: 'button' }, [el('span', {}, v.name), el('span', { class: 'accordion-icon' }, '+')]);
    const bodyInner = el('div', { class: 'accordion-body' }, el('div', { class: 'accordion-body-inner' }, [
      document.createTextNode(v.body + ' '),
      el('a', { href: v.link, target: '_blank', rel: 'noopener', class: 'inline-link' }, 'Read more ↗'),
    ]));
    header.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      header.querySelector('.accordion-icon').textContent = open ? '×' : '+';
    });
    item.appendChild(header); item.appendChild(bodyInner);
    acc.appendChild(item);
  });

  const ostList = qs('#ostList', container);
  OFFDUTY.ost.forEach(o => {
    ostList.appendChild(el('a', { class: 'ost-card', href: o.url, target: '_blank', rel: 'noopener' }, [
      el('span', { class: 'ost-rank' }, o.rank),
      el('span', { class: 'ost-meta' }, [el('p', { class: 'ost-title' }, o.title), el('p', { class: 'ost-sub' }, o.sub)]),
      el('span', { class: 'ost-arrow' }, '↗'),
    ]));
  });

  return () => document.removeEventListener('anime-updated', onAnimeUpdate);
}

/* ---------------- Connect ---------------- */
function renderConnect(container){
  container.innerHTML = `
    <p class="eyebrow">xia_qi / connect</p>
    <h1>Connect</h1>
    <p class="lede">Say hi, or don't — I'm not the boss of you.</p>
    <div class="connect-row">
      <div class="connect-card">
        <div><span class="connect-k">GITHUB</span><span class="connect-v">${XIA.handle}</span></div>
        <a class="btn" style="padding:6px 10px;" href="https://github.com/${XIA.handle}" target="_blank" rel="noopener">Visit ↗</a>
      </div>
      <div class="connect-card">
        <div><span class="connect-k">DISCORD</span><span class="connect-v">${XIA.discord}</span></div>
        <button class="copy-btn" id="copyDiscordConnect" type="button">Copy</button>
      </div>
      <div class="connect-card">
        <div><span class="connect-k">EMAIL</span><span class="connect-v">${XIA.email}</span></div>
        <a class="btn" style="padding:6px 10px;" href="mailto:${XIA.email}">Email ↗</a>
      </div>
    </div>
    <div class="term-tip">also — there's a terminal built into this OS. Open it from the Start Menu, the taskbar, or press <kbd>\`</kbd> anywhere.</div>`;
  qs('#copyDiscordConnect', container).addEventListener('click', (e) => {
    copyText(XIA.discord).then(() => {
      const b = e.currentTarget, orig = b.textContent;
      b.textContent = 'Copied!';
      setTimeout(() => { b.textContent = orig; }, 1600);
    }).catch(() => {});
  });
}

const RENDERERS = { home: renderHome, stack: renderStack, builds: renderBuilds, offduty: renderOffDuty, connect: renderConnect };

Apps.portfolio = {
  id: 'portfolio', title: 'Portfolio', icon: APPICON.portfolio, accent: 'cyan',
  open(tabId){
    const existing = WM.list().find(w => w.appId === 'portfolio');
    if(existing){
      WM.focus(existing.id);
      if(existing.minimized) WM.restore(existing.id);
      if(tabId && existing.switchTab) existing.switchTab(tabId);
      return existing;
    }
    return WM.open({
      appId: 'portfolio', title: 'Xia Qi — Portfolio', icon: APPICON.portfolio, accent: 'cyan',
      width: 700, height: 640, minWidth: 460, minHeight: 380, singleton: true,
      render(body, win){
        body.innerHTML = `
          <div class="app" style="display:flex;flex-direction:column;height:100%;">
            <div class="pf-tabbar" id="pfTabs"></div>
            <div class="app-pad pf-content" id="pfContent" style="flex:1;overflow-y:auto;"></div>
          </div>`;
        const tabsEl = qs('#pfTabs', body);
        const contentEl = qs('#pfContent', body);
        let activeCleanup = null;

        function switchTab(id){
          if(!RENDERERS[id]) id = 'home';
          if(activeCleanup){ activeCleanup(); activeCleanup = null; }
          qsa('.pf-tab', tabsEl).forEach(t => t.classList.toggle('active', t.dataset.tab === id));
          const cleanup = RENDERERS[id](contentEl, switchTab);
          if(typeof cleanup === 'function') activeCleanup = cleanup;
          contentEl.scrollTop = 0;
        }

        TABS.forEach(t => {
          const btn = el('button', { class: 'pf-tab', type: 'button', 'data-tab': t.id }, [
            el('span', { class: 'pf-tab-icon', html: t.icon }), el('span', {}, t.label),
          ]);
          btn.addEventListener('click', () => switchTab(t.id));
          tabsEl.appendChild(btn);
        });

        win.switchTab = switchTab;
        win.cleanup = () => { if(activeCleanup) activeCleanup(); };
        switchTab(tabId || 'home');
      },
    });
  },
};
})();
