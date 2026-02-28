/**
 * engine.js — 3D World Engine
 * Manages the A-Frame scene, tiles loading, camera setup,
 * and coordinates with the game bridge.
 */

(function () {
  var scene = document.querySelector('#game-scene');
  var loadingScreen = document.getElementById('loading-screen');
  var isReady = false;

  // Register loading screen click handler immediately
  // (not gated behind scene.loaded — so it always works)
  if (loadingScreen) {
    loadingScreen.addEventListener('click', function () {
      loadingScreen.classList.add('hidden');
      if (scene && scene.canvas && scene.canvas.requestPointerLock) {
        scene.canvas.requestPointerLock();
      }
    });
  }

  function markReady() {
    if (isReady) return;
    isReady = true;
    if (window.gameEngine) window.gameEngine.setReady();
    if (loadingScreen) {
      loadingScreen.querySelector('.loader-fill').style.width = '100%';
      var hint = loadingScreen.querySelector('.loader-hint');
      hint.textContent = 'Click to start exploring';
      hint.classList.add('pulse');
    }
  }

  // Scene lifecycle
  if (scene) {
    scene.addEventListener('loaded', function () {
      console.log('A-Frame scene loaded');
    });
    scene.addEventListener('renderstart', function () {
      console.log('Rendering started');
    });
  }

  // Tiles-ready event or 3-second fallback
  window.addEventListener('tilesReady', markReady);
  setTimeout(markReady, 3000);

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'm' || e.key === 'M') {
      window.dispatchEvent(new CustomEvent('toggleMinimap'));
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleChat'));
    }
    if (e.key === 'Escape') {
      window.dispatchEvent(new CustomEvent('closeOverlays'));
    }
  });
})();
