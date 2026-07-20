# xia-qi.is-a.dev

Personal portfolio site — dark, circuit-board themed, built with plain HTML/CSS/JS (no build step, no dependencies). Two skill tracks, projects sorted by status, an off-duty page with a live anime tracker, an actual audio player, and a secret terminal wired into every page.


## Running locally

`builds.json`, `anime.json`, and `music/tracks.json` are all loaded with `fetch()`, which browsers block on `file://` URLs. Opening `index.html` directly will mostly work, but those three pages will show empty/error states. Serve the folder instead:

```
python3 -m http.server
```

then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push everything to the repo root (not a subfolder) — `404.html` in particular has to sit at the root for GitHub Pages to serve it automatically on any missing path.
2. In the repo's **Settings → Pages**, set the source to the branch you pushed to.
3. Done — no build step to configure.

## The secret terminal

Press `` ` `` anywhere on the site to open it. Supports `help`, `whoami`, `neofetch`, `ls [-a]`, `cat <file>`, `projects`, `contact`, `play <name>`, `matrix`, `sudo <cmd>`, `konami`, `clear`, `exit`, and a few things that aren't listed in `help` on purpose.

## Known TODO

- [ ] Move `EulerProjectAttempts` progress in `builds.json` as it moves forward