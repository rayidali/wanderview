/**
 * engine.js — 3D World Engine
 * Manages the A-Frame scene, tiles loading, camera setup,
 * and coordinates with the game bridge.
 */

(function () {
  const scene = document.querySelector('#game-scene');
  const loadingScreen = document.getElementById('loading-screen');

  let isReady = false;

  // Wait for A-Frame scene to load
  if (scene) {
    scene.addEventListener('loaded', function () {
      console.log('A-Frame scene loaded');
      onSceneReady();
    });
  }

  function onSceneReady() {
    // Hide loading screen on first click (pointer lock)
    if (loadingScreen) {
      loadingScreen.addEventListener('click', function () {
        loadingScreen.classList.add('hidden');
        // Request pointer lock after dismissing loading screen
        const canvas = scene.canvas;
        if (canvas && canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
      });
    }

    // If tiles are loading, listen for ready event
    window.addEventListener('tilesReady', function () {
      isReady = true;
      if (loadingScreen) {
        loadingScreen.querySelector('.loader-fill').style.width = '100%';
        loadingScreen.querySelector('.loader-hint').textContent = 'Click to start exploring';
        loadingScreen.querySelector('.loader-hint').classList.add('pulse');
      }
    });

    // Set a timeout to show ready state even without tiles
    setTimeout(function () {
      if (!isReady) {
        isReady = true;
        if (window.gameEngine) window.gameEngine.setReady();
        if (loadingScreen) {
          loadingScreen.querySelector('.loader-fill').style.width = '100%';
          loadingScreen.querySelector('.loader-hint').textContent = 'Click to start exploring';
          loadingScreen.querySelector('.loader-hint').classList.add('pulse');
        }
      }
    }, 3000);

    // Track position updates at lower frequency for perf
    let lastUpdate = 0;
    scene.addEventListener('renderstart', function () {
      console.log('Rendering started');
    });
  }

  // Keyboard shortcut: press M to toggle minimap
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
