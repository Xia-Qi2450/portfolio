/* ============================================================
   XiaOS — apps/terminal.js
   Ports every command from the original site's secret terminal
   (help, whoami, neofetch, ls, cat, projects, contact, play,
   rm/sudo joke, sl, vim, hack, 42, konami, echo, date, matrix,
   clear, exit) and adds a few OS-native ones: open, apps, ver,
   lock, restart, shutdown.
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

const APP_OPEN_ACTIONS = {
  home: () => Apps.portfolio.open('home'),
  stack: () => Apps.portfolio.open('stack'),
  builds: () => Apps.portfolio.open('builds'),
  offduty: () => Apps.portfolio.open('offduty'),
  'off-duty': () => Apps.portfolio.open('offduty'),
  connect: () => Apps.portfolio.open('connect'),
  portfolio: () => Apps.portfolio.open(),
  playlist: () => Apps.playlist.open(),
  explorer: () => Apps.explorer.open(),
  files: () => Apps.explorer.open(),
  terminal: () => Apps.terminal.open(),
  settings: () => Apps.settings.open(),
  taskmgr: () => Apps.taskmgr.open(),
  taskmanager: () => Apps.taskmgr.open(),
  'task manager': () => Apps.taskmgr.open(),
};

function buildTerminal(body, win, opts){
  const isEmbedded = !!(opts && opts.embedded);
  body.innerHTML = `
    <div class="term-app">
      <div class="term-app-body" id="termBody"></div>
      <div class="term-app-input-row">
        <span class="term-app-prompt">guest@xia-qi:~$</span>
        <input class="term-app-input" id="termInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="terminal input">
      </div>
    </div>`;
  const termBody = qs('#termBody', body);
  const termInput = qs('#termInput', body);
  const cmdHistory = [];
  let histPos = -1;

  function tprint(text, cls){
    const div = el('div', { class: 'line' + (cls ? ' ' + cls : '') }, text);
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }
  function tprintMulti(text, cls){ text.split('\n').forEach(l => tprint(l, cls)); }
  function tprintDelayed(lines, delayEach){
    lines.forEach((l, i) => setTimeout(() => tprint(l.text, l.cls), i * delayEach));
  }

  tprint("xia-qi terminal (XiaOS build) — type 'help' to see what's here.", 'dim');
  tprint('');

  function runRmJoke(){
    tprintDelayed([
      { text: 'this had better be a joke...', cls: 'dim' },
      { text: 'deleting /home/xia...', cls: 'dim' },
      { text: 'deleting /etc/dog...', cls: 'dim' },
      { text: 'deleting the concept of bugs...', cls: 'dim' },
      { text: "wait, that's not how any of this works.", cls: 'dim' },
      { text: "jk — this is a static site. there's nothing to rm. 🐾", cls: 'ok' },
    ], 420);
  }

  function runCommand(raw){
    const trimmed = raw.trim();
    if(trimmed.length) cmdHistory.push(trimmed);
    histPos = cmdHistory.length;
    tprint('guest@xia-qi:~$ ' + raw, 'in-line');
    if(!trimmed.length) return;
    if(trimmed.includes(':(){') || trimmed.includes(':|:&')){ tprint("nice try. this terminal doesn't have a shell to bomb.", 'err'); return; }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch(cmd){
      case 'help':
        tprintMulti(
          "available commands:\n" +
          "  help              show this list\n" +
          "  whoami            about me\n" +
          "  neofetch          system info, allegedly\n" +
          "  ls [-a]           list files\n" +
          "  cat <file>        read a file\n" +
          "  projects          list pinned repos\n" +
          "  contact           how to reach me\n" +
          "  play <name>       play a track, or try miku / teto\n" +
          "  open <app>        launch an app (stack/builds/offduty/connect/playlist/explorer/settings/taskmgr)\n" +
          "  apps              list launchable apps\n" +
          "  matrix            uh oh\n" +
          "  sudo <cmd>        try it\n" +
          "  konami            you know what this does\n" +
          "  ver               XiaOS version info\n" +
          "  lock / restart / shutdown    power controls\n" +
          "  clear             clear the screen\n" +
          "  exit              close terminal\n" +
          "  (a few commands aren't listed here. good luck.)"
        );
        break;
      case 'whoami':
        tprintMulti("xia_qi — student, frontend+backend dev, occasional hardware tinkerer.\nprobably debugging something right now.");
        break;
      case 'neofetch':
        tprintMulti(
          "xia@qi\n" +
          "------\n" +
          "OS: XiaOS (definitely just a portfolio site)\n" +
          "Shell: zsh --fake\n" +
          "WM: xwm (hand-rolled)\n" +
          "Languages: Python, HTML/CSS/JS, Luau\n" +
          "Hobbies: 3D printing, Arduino, PC building, Minecraft modding\n" +
          "NOW PLAYING: " + (Apps.playlist && Apps.playlist.currentTrack() ? (Apps.playlist.currentTrack().title) : "KEYGEN CHURCH - Tenebre Rosso Sangue (ULTRAKILL Soundtrack)") + "\n" +
          "Uptime: since forever, brain still compiling"
        );
        break;
      case 'ls':
        if(args[0] === '-a'){ tprint(Object.keys(TERMINAL_FILES).join('  ') + '  ' + Object.keys(TERMINAL_HIDDEN_FILES).join('  ')); tprint('(found a few hidden ones, huh)', 'dim'); }
        else { tprint(Object.keys(TERMINAL_FILES).join('  ')); }
        break;
      case 'cat':
        if(!args[0]){ tprint('usage: cat <file>', 'err'); break; }
        if(TERMINAL_FILES[args[0]]) tprintMulti(TERMINAL_FILES[args[0]]);
        else if(TERMINAL_HIDDEN_FILES[args[0]]) tprintMulti(TERMINAL_HIDDEN_FILES[args[0]], 'ok');
        else tprint('cat: ' + args[0] + ': No such file or directory', 'err');
        break;
      case 'projects':
        TERMINAL_REPOS.forEach(([name, desc, url]) => { tprint(name.padEnd(22) + '— ' + desc); tprint('  ' + url, 'dim'); });
        break;
      case 'contact':
        tprintMulti(TERMINAL_FILES['contact.txt']);
        break;
      case 'play': {
        if(!args[0]){ tprint('usage: play <name>', 'err'); break; }
        const found = window.playByQuery ? window.playByQuery(args.join(' ')) : null;
        if(found) tprint('▸ now playing: ' + (found.title || found.file) + (found.artist ? ' — ' + found.artist : ''), 'ok');
        else if(args[0].toLowerCase() === 'miku') tprint('▸ now playing: Hatsune Miku — synth vocals engaged. 🟢 (add real tracks to music/tracks.json to actually hear something)', 'ok');
        else if(args[0].toLowerCase() === 'teto') tprint('▸ now playing: Kasane Teto — bread reserves: nominal. 🍞 (add real tracks to music/tracks.json to actually hear something)', 'ok');
        else tprint("can't find that track. try 'play miku', 'play teto', or add it to music/tracks.json.", 'err');
        break;
      }
      case 'open': {
        if(!args[0]){ tprint('usage: open <app> — try `apps` to list them', 'err'); break; }
        const key = args.join(' ').toLowerCase();
        const action = APP_OPEN_ACTIONS[key] || APP_OPEN_ACTIONS[args[0].toLowerCase()];
        if(action){ tprint('▸ opening ' + key + '...', 'ok'); action(); }
        else tprint("open: unknown app '" + args.join(' ') + "' — try `apps` to list them.", 'err');
        break;
      }
      case 'apps':
        tprintMulti('portfolio (home/stack/builds/offduty/connect)  playlist  explorer  terminal  taskmgr  settings');
        tprint("usage: open <app>  — e.g. `open stack`, `open task manager`", 'dim');
        break;
      case 'ver':
        tprint('XiaOS v1.0 "Copper Trace" — built on a portfolio, running on vibes.', 'ok');
        break;
      case 'lock':
        tprint('locking...', 'dim');
        setTimeout(() => { if(window.XiaOS) window.XiaOS.lock(); }, 300);
        break;
      case 'restart':
        tprint('restarting XiaOS...', 'dim');
        setTimeout(() => { if(window.XiaOS) window.XiaOS.restart(); }, 500);
        break;
      case 'shutdown':
        tprint('shutting down...', 'dim');
        setTimeout(() => { if(window.XiaOS) window.XiaOS.shutdown(); }, 500);
        break;
      case 'rm':
        if(args.includes('-rf') && args.includes('/')) runRmJoke();
        else tprint('rm: missing operand (also, there is nothing to delete here)', 'err');
        break;
      case 'sudo':
        if(args.includes('rm') && args.includes('-rf') && args.includes('/')) runRmJoke();
        else if(args.join(' ').includes('make me a sandwich')) tprint('sudo: okay fine. 🥪 (still not real food though)', 'ok');
        else if(args[0] === 'su') tprint('sudo su: you are now root. (you were already root — it\'s a static site.)', 'dim');
        else tprint('sudo: permission denied. nice try though.', 'err');
        break;
      case 'sl':
        tprint('choo choo! 🚂💨 (pretty sure you meant \'ls\')', 'dim');
        break;
      case 'vim': case ':q': case ':wq':
        tprint("how do you exit vim? nobody actually knows. try 'exit' instead.", 'err');
        break;
      case 'hack':
        tprint('access granted. jk — this is a portfolio site, not a heist movie. 🛰️', 'dim');
        break;
      case '42':
        tprint('the answer to life, the universe, and everything.', 'ok');
        break;
      case 'konami':
        if(window.triggerKonami) window.triggerKonami();
        break;
      case 'echo':
        tprint(args.join(' '));
        break;
      case 'date':
        tprint(new Date().toString());
        break;
      case 'matrix':
        if(window.toggleMatrix) window.toggleMatrix();
        tprint(window.matrixOn ? 'wake up...' : 'back to reality.', 'dim');
        break;
      case 'clear':
        termBody.innerHTML = '';
        break;
      case 'exit':
        tprint('Bye!', 'ok');
        if(!isEmbedded) setTimeout(() => WM.close(win.id), 200);
        break;
      default:
        tprint("command not found: " + cmd + " — type 'help' to see what's available.", 'err');
    }
  }

  termInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ const val = termInput.value; termInput.value = ''; runCommand(val); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); if(cmdHistory.length){ histPos = Math.max(0, histPos - 1); termInput.value = cmdHistory[histPos] || ''; } }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); if(cmdHistory.length){ histPos = Math.min(cmdHistory.length, histPos + 1); termInput.value = cmdHistory[histPos] || ''; } }
  });

  if(win){
    win.el.addEventListener('mousedown', () => setTimeout(() => termInput.focus(), 0));
    setTimeout(() => termInput.focus(), 60);
  }
  return { focusInput: () => termInput.focus(), runCommand };
}

Apps.terminal = {
  id: 'terminal', title: 'Terminal', icon: APPICON.terminal, accent: 'cyan',
  open(){
    return WM.open({
      appId: 'terminal', title: 'guest@xia-qi: ~', icon: APPICON.terminal, accent: 'cyan',
      width: 560, height: 400, singleton: true, noPad: true,
      render(body, win){ buildTerminal(body, win, { embedded: false }); },
    });
  },
};

/* exposed for the quick backtick overlay in easter-eggs.js */
window.buildTerminalUI = buildTerminal;
})();
