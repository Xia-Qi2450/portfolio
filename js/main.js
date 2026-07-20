/* ============================================================
   XiaOS — main.js
   Bootstraps everything once the DOM is ready.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // restore saved personalization before first paint of the desktop
  if(window.applyAccent) {window.applyAccent(LS.get('xiaos-accent') || 'dual');};
  if(LS.get('xiaos-reduce-motion') === 'on') {document.body.classList.add('reduce-motion');};

  WM.init();
  Desktop.init();
  Taskbar.init();
  StartMenu.init();
  ActionCenter.init();

  if(LS.get('xiaos-wallpaper') && window.setWallpaper){
    window.setWallpaper(LS.get('xiaos-wallpaper'));
  }

  loadLiveData();
  Boot.start();
});
