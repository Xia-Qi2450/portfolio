/* ============================================================
   XiaOS — data.js
   All the content that used to live in builds.json / anime.json /
   tracks.json / hardcoded page copy on xia-qi.is-a.dev, ported
   in as plain JS so every app works with zero network requests.
   (Also still fetches the real .json files as a live overlay —
   see loadLiveData() at the bottom — so editing those files in
   the repo keeps working exactly like before.)
   ============================================================ */

const XIA = {
  name: "Xia Qi",
  handle: "Xia-Qi2450",
  discord: "dw_aelious",
  email: "xiaqihill2010@gmail.com",
  avatar: "https://avatars.githubusercontent.com/u/196024955?v=4",
  bio: "I'm Xia Qi, a student who spends way too much time writing Python, designing websites, and coming up with project ideas that somehow keep getting bigger.",
  role: { sw: "Frontend + Backend", hw: "Maker" },
  status: "probably deep in a rabbit hole right now",
};

const BUILDS = [
  { title: "dogcheck", desc: "A web recreation of the DOGCHECK screen from Toby Fox's games — URL parameters let you override the message, or show an HTTP/Chrome error code with its official name. 5% chance of an easter egg (DELTARUNE Chapter 4 spoilers).", url: "https://github.com/Xia-Qi2450/dogcheck", lang: "HTML", status: "finished", progress: 100, featured: true },
  { title: "robo-queue", desc: "A small Python program built to help with robotics competition prep. Uses text-to-speech to announce the names.", url: "https://github.com/Xia-Qi2450/robo-queue", lang: "Python", status: "finished", progress: 100 },
  { title: "SCP_Data", desc: "A terminal UI that displays articles straight from the official SCP Wiki. You have to add SCP entries by yourself.", url: "https://github.com/Xia-Qi2450/SCP_Data", lang: "Python", status: "finished", progress: 100 },
  { title: "ttsScript", desc: "A friendly text-to-speech script built on pyttsx3. Run this on a Windows machine for maximum compatibility.", url: "https://github.com/Xia-Qi2450/ttsScript", lang: "Python", status: "finished", progress: 100 },
  { title: "animeClassPython", desc: "Ran out of project ideas mid-way through this one. Probably easier to just go read the code. It's still somehow actively editied", url: "https://github.com/Xia-Qi2450/animeClassPython", lang: "Python", status: "in-progress", progress: 12 },
  { title: "EulerProjectAttempts", desc: "Ongoing attempts at the Project Euler archive of problems — open-ended by nature, so this one never really finishes. (I'm aiming to finish 100 questions)", url: "https://github.com/Xia-Qi2450/EulerProjectAttempts", lang: "Python", status: "in-progress", progress: 20 },
  { title: "pythonTest", desc: "A script where you can run all of your Python endavours. Experiment with your code without the normal 'Traceback (most recent call last)'.", url: "https://github.com/Xia-Qi2450/pythonTest", lang: "Python", status: "in-progress", progress: 12 },
  { title: "musicTrasition", desc: "A calm to combat music transition inspired by ULTRAKILL. Using PyGame and Tkinker.", url: "https://xia-qi2450.github.io/dogcheck/?error=404&url=https://github.com/Xia-Qi2450/musicTransition/", lang: "Python", status: "todo", progress: 0 },
  { title: "ultrakillStyle", desc: "A recreation of the ULTRAKILL style meter in the terminal that reacts to what you do on your device.", url: "https://xia-qi2450.github.io/dogcheck/?error=404&url=https://github.com/Xia-Qi2450/ultrakillStyle/", lang: "Python", status: "todo", progress: 0 },
];

const ANIME = {
  watchlist: [
    { title: "Love, Chunibyo & Other Delusions!", note: "I watched the movie so I am now going to watch the anime now." },
    { title: "Magical Girl Site", note: "I need my dose of psychological damage and unfortunately DDLC is kinda not doing it anymore." },
    { title: "My Dress-Up Darling", note: "Well... I got immediately bombarded with fan-service. I will rewatch it when I run out of content." },
  ],
  binging: [
    { title: "The Quintessential Quintuplets Season 2", progress: 0, note: "ep 0/12 — Finished Season 1, Need to watch Season 2 now" },
  ],
  completed: [
    { title: "Alya Sometimes Hides her Feelings in Russian", note: "My first romance anime. It was peak! Can't wait for season 2" },
    { title: "Toradora", note: "My friend forced me to watch it to experience the 'Tsundere' trope" },
    { title: "The 100 Girlfriends Who Really, Really, Really, Really, Really Love You", note: "First Harem anime experience. It was good. Also why do they have to put this many really-s? Watched both Season 1 & 2" },
    { title: "Call of the Night", note: "People say that YouTube Shorts anime recommendations are trash. I'd beg to differ. Watched both Season 1 & 2" },
    { title: "The Quintessential Quintuplets Season 1", note: "A suggestion by my friend. Also Miku Supremacy" },
  ],
};

const TRACKS_FALLBACK = [
  { title: "After Hours (ULTRAKILL OST: 7-S Theme)", artist: "Heaven Pierce Her", file: "music/afterhours.mp3", cover: "music/covers/Encores_I_Cover.webp" },
  { title: "Another Medium (UNDERTALE OST)", artist: "Toby Fox", file: "music/anothermedium.mp3", cover: "music/covers/UNDERTALE_Soundtrack_cover.png" },
  { title: "Castle Vein (ULTRAKILL OST: 1-3 Theme)", artist: "Heaven Pierce Her", file: "music/castlevein.mp3", cover: "music/covers/INFINITEHYPERDEATH.webp" },
  { title: "Cold Winds (ULTRAKILL OST: 2-1 Theme)", artist: "Heaven Pierce Her", file: "music/coldwinds.mp3", cover: "music/covers/INFINITEHYPERDEATH.webp" },
  { title: "CORE (UNDERTALE OST)", artist: "Toby Fox", file: "music/core.mp3", cover: "music/covers/UNDERTALE_Soundtrack_cover.png" },
  { title: "Field of Hopes and Dreams (DELTARUNE Chapter 1 OST)", artist: "Toby Fox", file: "music/field.mp3", cover: "music/covers/DELTARUNE_Chapter_1_OST_cover.png.webp" },
  { title: "Ever Higher (DELTARUNE Chapter 3+4 OST)", artist: "Toby Fox", file: "music/everhigher.mp3", cover: "music/covers/DELTARUNE_Chapters_3+4_OST_cover.png.webp" },
  { title: "Fireplace (DELTARUNE Chapter 3+4 OST)", artist: "Toby Fox", file: "music/fireplace.mp3", cover: "music/covers/DELTARUNE_Chapters_3+4_OST_cover.png.webp" },
  { title: "Flower Castle (DELTARUNE Chapter 5 OST)", artist: "Toby Fox", file: "music/flowercastle.mp3", cover: "music/covers/DELTARUNE_Chapter_5_OST_cover.png.webp" },
  { title: "Garden of Hopes and Dreams (DELTARUNE Chapter 5 OST)", artist: "Toby Fox", file: "music/garden.mp3", cover: "music/covers/DELTARUNE_Chapter_5_OST_cover.png.webp" },
  { title: "Hopes and Dreams (UNDERTALE OST)", artist: "Toby Fox", file: "music/hopesanddreams.mp3", cover: "music/covers/UNDERTALE_Soundtrack_cover.png" },
  { title: "Machine Love (feat. Kasane Teto SV)", artist: "Jamie Paige", file: "music/machinelove.mp3", cover: "music/covers/machinelovecover.jpg" },
  { title: "Miku (feat. Hatsune Miku)", artist: "Anamanaguchi & Hatsune Miku", file: "music/miku.mp3", cover: "music/covers/anamanaguchimikucover.jpg" },
  { title: "Pandora Palace (DELTARUNE Chapter 2 OST", artist: "Toby Fox", file: "music/pandorapalace.mp3", cover: "music/covers/DELTARUNE_Chapter_2_OST_cover.png.webp" },
  { title: "Racing into the Night (夜に駆ける)", artist: "YOASOBI", file: "music/racingintothenight.mp3", cover: "music/covers/racingintothenightcover.jpg" },
  { title: "Retry Now (feat. Hatsune Miku)", artist: "NAKISO", file: "music/retrynow.mp3", cover: "music/covers/retrynowcover.jpg" },
  { title: "Tenebre Rosso Sangue (Calm) (ULTRAKILL OST: P-2 #1 Theme)", artist: "KEYGEN CHURCH", file: "music/tenebrerossosangue_c.mp3", cover: "music/covers/tenebrerossosanguecover.jpg" },
  { title: "Tenebre Rosso Sangue (ULTRAKILL OST: P-2 #1 Theme)", artist: "KEYGEN CHURCH", file: "music/tenebrerossosangue.mp3", cover: "music/covers/tenebrerossosanguecover.jpg" },
  { title: "Want You Gone (Portal 2: Songs to Test By - Volume 3)", artist: "Aperture Science Psychoacoustics Laboratory", file: "music/wantyougone.mp3", cover: "music/covers/Portal_2_Soundtrack_Cover_-_Volume_1.jpg" },
];

const OFFDUTY = {
  games: [
    { title: "Minecraft", genre: "Sandbox / Building", desc: "The one that never really ends — especially once mods enter the picture.", logo: "assets/Minecraft_logo.svg", cls: "minecraft" },
    { title: "DELTARUNE", genre: "RPG", desc: "Toby Fox's ongoing RPG — chapter by chapter, and worth the wait every time.", logo: "assets/Deltarune_logo.svg", cls: "deltarune" },
    { title: "ULTRAKILL", genre: "FPS / Character Action", desc: "Fast, brutal, and precise — the kind of game that punishes hesitation.", logo: "assets/Ultrakill_logo.svg", cls: "ultrakill" },
  ],
  vocalSynth: [
    { name: "Hatsune Miku", body: "The first of Crypton Future Media's Character Vocal Series, released in 2007 for the VOCALOID2 engine. Teal twintails, an \"android diva\" concept, and the voicebank that basically defined an entire genre of music production. If someone's heard of exactly one vocal synth, it's her.", link: "https://vocaloid.fandom.com/wiki/Hatsune_Miku" },
    { name: "Kasane Teto", body: "Started life in 2008 as an April Fools' prank — a fake \"new Vocaloid\" — before actually being built as a UTAU voicebank. Red drill-twintails, chaotic community lore, and a running fandom joke that she's fueled by bread. Later got an official Synthesizer V voicebank of her own.", link: "https://vocaloid.fandom.com/wiki/Kasane_Teto" },
  ],
  ost: [
    { rank: "01", title: "Flower Castle", sub: "Toby Fox — DELTARUNE Chapter 5 OST", url: "https://www.youtube.com/watch?v=ICFPzrihGX8" },
    { rank: "02", title: "Tenebre Rosso Sangue", sub: "KEYGEN CHURCH — ULTRAKILL OST", url: "https://www.youtube.com/watch?v=L5q4uYj-gyg" },
    { rank: "03", title: "夜に駆ける (Yoru ni Kakeru)", sub: "YOASOBI", url: "https://www.youtube.com/watch?v=x8VYWazR5mE" },
  ],
};

const TERMINAL_FILES = {
  "about.txt": XIA.bio,
  "skills.txt": "software: Python, HTML, CSS, JavaScript, Luau\nhardware: Arduino, 3D Printing, PC Building, Minecraft Modding",
  "music.playlist": "now playing:\n- Hatsune Miku (various)\n- Kasane Teto (various)\n- DELTARUNE OST\n- ULTRAKILL OST",
  "contact.txt": "GitHub: github.com/" + XIA.handle + "\ndiscord: " + XIA.discord + "\nemail: " + XIA.email,
  "anime.txt": "Dude... \nWho would want to see someone's anime.txt file? \nYou just got baited.",
  "ultrakilltechs.txt": "I play the game for fun. \nI have learnt no cool techniques. \nI don't even know how to railcoin.",
};
const TERMINAL_HIDDEN_FILES = {
  "secret.txt": "you found the hidden file. \ud83d\udc3e\nfun fact: the 'dogcheck' repo exists purely because of a Toby Fox bit. no regrets.",
  "bruh.txt" : "Never gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you",
  "miku.txt" : "[Verse 1] \nMiku, Miku, you can call me Miku \nBlue hair, blue tie, hiding in your Wi-Fi \nOpen secrets, anyone can find me \nHear your music running through my mind \n\n[Chorus] \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \n\n[Pre-Chorus] \nI'm on top of the world because of you \nAll I wanted to do is follow you \nI'll keep singing along to all of you \nI'll keep singing along \n\n[Chorus] \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh) \nI'm thinking Miku, Miku (Ooh-ee-ooh)"
};
const TERMINAL_REPOS = [
  ["dogcheck", "DELTARUNE dogcheck screen, on the web", "github.com/Xia-Qi2450/dogcheck"],
  ["robo-queue", "robotics competition prep helper", "github.com/Xia-Qi2450/robo-queue"],
  ["SCP_Data", "TUI reader for the SCP Wiki", "github.com/Xia-Qi2450/SCP_Data"],
  ["ttsScript", "text-to-speech via pyttsx3", "github.com/Xia-Qi2450/ttsScript"],
  ["animeClassPython", "ran out of ideas, ended up here", "github.com/Xia-Qi2450/animeClassPython"],
  ["EulerProjectAttempts", "Project Euler archive attempts", "github.com/Xia-Qi2450/EulerProjectAttempts"],
];

const STACK_INFO = {
  software: {
    chips: ["Python", "HTML", "CSS", "JavaScript", "Luau"],
    blurb: "Scripts, sites, and the occasional game system. If it starts as \"wouldn't it be cool if—\", it usually ends up here first.",
    extra: "Most of it starts as a small Python script solving one specific annoyance, and grows from there. The web side is usually in service of a bigger idea — a tool, a display, or a joke that got a little out of hand. Luau shows up whenever the project drifts toward games.",
  },
  hardware: {
    chips: ["Arduino", "3D Printing", "PC Building", "Minecraft Modding"],
    blurb: "If it has a plug, a filament spool, or a mod loader, it's fair game.",
    extra: "The hardware side keeps the software side honest — nothing forces you to actually understand a problem like having to make it, print it, or debug it with a multimeter in hand. PC builds and Minecraft mods are where the tinkering gets more playful. P.S. I may or may not have blew a capacitor or two. It was funny OK?",
  },
};

/* live tracks array — apps read from this; starts as the fallback,
   gets swapped for the real music/tracks.json contents if that
   fetch succeeds (keeps parity with "edit the json, it just works") */
let TRACKS = TRACKS_FALLBACK.slice();

let LIVE_BUILDS = BUILDS.slice();
let LIVE_ANIME = ANIME;

function loadLiveData(){
  if(typeof fetch !== 'function') {return;}; // no network fetch available — the embedded fallback data above still works fine
  try{
    fetch('music/tracks.json').then(r => r.ok ? r.json() : null).then(data => {
      if(Array.isArray(data) && data.length){ TRACKS = data; document.dispatchEvent(new CustomEvent('tracks-updated')); }
    }).catch(() => {});
    fetch('assets/builds.json').then(r => r.ok ? r.json() : null).then(data => {
      if(Array.isArray(data) && data.length){ LIVE_BUILDS = data; document.dispatchEvent(new CustomEvent('builds-updated')); }
    }).catch(() => {});
    fetch('assets/anime.json').then(r => r.ok ? r.json() : null).then(data => {
      if(data && typeof data === 'object'){ LIVE_ANIME = data; document.dispatchEvent(new CustomEvent('anime-updated')); }
    }).catch(() => {});
  }catch(e){ /* environments that throw synchronously on fetch() rather than rejecting */ }
}
