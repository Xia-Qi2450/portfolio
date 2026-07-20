/* ============================================================
   XiaOS — apps/playlist.js
   Audio element lives at module scope so playback survives the
   window being closed/reopened (like a real media session).
   ============================================================ */
(function(){
const Apps = window.Apps = window.Apps || {};

const audio = new Audio();
audio.volume = 0.7;

function safePlay(onOk){
  let p;
  try{ p = audio.play(); }catch(e){ return; }
  if(p && typeof p.then === 'function') p.then(() => { if(onOk) onOk(); }).catch(() => {});
  else if(onOk) onOk();
}
let currentIndex = -1;
let isPlaying = false;
let listeners = []; // ui refresh callbacks registered by whichever window instance is open

function notify(){ listeners.forEach(fn => { try{ fn(); }catch(e){} }); }

function selectTrack(i, autoplay){
  if(!TRACKS[i]) return;
  currentIndex = i;
  const t = TRACKS[i];
  audio.src = t.file;
  audio.load();
  notify();
  if(autoplay){ safePlay(() => { isPlaying = true; notify(); }); }
}
function togglePlay(){
  if(currentIndex === -1){ if(TRACKS.length) selectTrack(0, true); return; }
  if(isPlaying){ audio.pause(); }
  else { safePlay(); }
}
function nextTrack(){ if(!TRACKS.length) return; selectTrack((currentIndex + 1) % TRACKS.length, true); }
function prevTrack(){ if(!TRACKS.length) return; selectTrack((currentIndex - 1 + TRACKS.length) % TRACKS.length, true); }

audio.addEventListener('play', () => { isPlaying = true; notify(); });
audio.addEventListener('pause', () => { isPlaying = false; notify(); });
audio.addEventListener('ended', nextTrack);
audio.addEventListener('timeupdate', notify);
audio.addEventListener('loadedmetadata', notify);

window.playByQuery = function(query){
  const q = query.toLowerCase();
  const idx = TRACKS.findIndex(t => (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q));
  if(idx !== -1){ selectTrack(idx, true); Apps.playlist.open(); return TRACKS[idx]; }
  return null;
};

function buildUI(body, win){
  body.innerHTML = `
    <div class="app app-pad">
      <p class="eyebrow">xia_qi / playlist</p>
      <h1>Playlist</h1>
      <p class="lede">An actual audio player, wired up to whatever's sitting in <code>/music/</code> — plus the real thing on YouTube.</p>
      <section>
        <p class="eyebrow">Now Playing</p>
        <div class="player" id="playerBox">
          <div class="player-now">
            <div class="player-art" id="playerArt">🎵</div>
            <div>
              <p class="player-title" id="playerTitle">No track loaded</p>
              <p class="player-artist" id="playerArtist">No artist</p>
            </div>
          </div>
          <div class="player-progress">
            <span class="p-time" id="curTime">0:00</span>
            <input type="range" id="seek" min="0" max="100" value="0" aria-label="seek">
            <span class="p-time end" id="durTime">0:00</span>
          </div>
          <div class="player-controls">
            <button class="pctrl" id="prevBtn" type="button" aria-label="previous">⏮</button>
            <button class="pctrl main" id="playBtn" type="button" aria-label="play">▶</button>
            <button class="pctrl" id="nextBtn" type="button" aria-label="next">⏭</button>
            <input type="range" class="vol" id="volume" min="0" max="1" step="0.01" value="${audio.volume}" aria-label="volume">
          </div>
          <ul class="track-list" id="trackList"></ul>
        </div>
      </section>
      <section>
        <p class="eyebrow">The Real Thing</p>
        <h2 style="font-size:16px;">Full playlist on YouTube</h2>
        <p class="sub">This is the actual, always-current playlist — the player above is more of a curated jukebox.</p>
        <div class="yt-embed-wrap">
          <iframe src="https://www.youtube.com/embed/Pk6QjMfhMNQ?si=g4jGSrbqMdS7FKu2" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <a class="btn btn-primary" href="https://youtube.com/playlist?list=PLYo8jUrBIzhk3luz3Ph3frHgniLZ8Al58&si=BCIP4VbCqey6Y3q8" target="_blank" rel="noopener">Open full playlist on YouTube ↗</a>
      </section>
    </div>`;

  const playerTitle = qs('#playerTitle', body), playerArtist = qs('#playerArtist', body), playerArt = qs('#playerArt', body);
  const playBtn = qs('#playBtn', body), seekEl = qs('#seek', body), curTimeEl = qs('#curTime', body), durTimeEl = qs('#durTime', body);
  const trackListEl = qs('#trackList', body), volumeEl = qs('#volume', body);

  function renderTrackList(){
    trackListEl.innerHTML = '';
    if(!TRACKS.length){ trackListEl.innerHTML = '<li class="track-empty">no tracks yet</li>'; return; }
    TRACKS.forEach((t, i) => {
      const li = el('li', { class: 'track-item' + (i === currentIndex ? ' playing' : '') }, [
        el('span', { class: 't-name' }, t.title || t.file),
        el('span', { class: 't-artist' }, t.artist || ''),
      ]);
      li.addEventListener('click', () => selectTrack(i, true));
      trackListEl.appendChild(li);
    });
  }

  function refresh(){
    if(currentIndex === -1){
      playerTitle.textContent = 'No track loaded'; playerArtist.textContent = 'No artist'; playerArt.innerHTML = '🎵';
    } else {
      const t = TRACKS[currentIndex];
      playerTitle.textContent = t.title || t.file;
      playerArtist.textContent = t.artist || '';
      playerArt.innerHTML = t.cover ? `<img src="${t.cover}" alt="">` : '🎵';
    }
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    if(audio.duration){ seekEl.value = (audio.currentTime / audio.duration) * 100; curTimeEl.textContent = formatTime(audio.currentTime); durTimeEl.textContent = formatTime(audio.duration); }
    renderTrackList();
  }

  playBtn.addEventListener('click', togglePlay);
  qs('#nextBtn', body).addEventListener('click', nextTrack);
  qs('#prevBtn', body).addEventListener('click', prevTrack);
  volumeEl.addEventListener('input', () => { audio.volume = parseFloat(volumeEl.value); });
  seekEl.addEventListener('input', () => { if(audio.duration) audio.currentTime = (seekEl.value / 100) * audio.duration; });

  listeners.push(refresh);
  win.cleanup = () => { listeners = listeners.filter(f => f !== refresh); };
  refresh();

  const onTracksUpdated = () => refresh();
  document.addEventListener('tracks-updated', onTracksUpdated);
  const prevCleanup = win.cleanup;
  win.cleanup = () => { prevCleanup(); document.removeEventListener('tracks-updated', onTracksUpdated); };
}

Apps.playlist = {
  id: 'playlist', title: 'Playlist', icon: APPICON.playlist, accent: 'cyan',
  open(){
    return WM.open({
      appId: 'playlist', title: 'Playlist — Xia Qi', icon: APPICON.playlist, accent: 'cyan',
      width: 640, height: 660, singleton: true,
      render: buildUI,
    });
  },
  isPlaying(){ return isPlaying; },
  toggle: togglePlay, next: nextTrack, prev: prevTrack,
  currentTrack(){ return currentIndex >= 0 ? TRACKS[currentIndex] : null; },
  playIndex(i){ selectTrack(i, true); Apps.playlist.open(); },
  playFile(file){
    const idx = TRACKS.findIndex(t => t.file === file);
    if(idx !== -1){ selectTrack(idx, true); Apps.playlist.open(); return true; }
    return false;
  },
  getVolume(){ return audio.volume; },
  setVolume(v){ audio.volume = Math.max(0, Math.min(1, v)); notify(); },
};
})();
