/**
 * tiles-component.js — Google 3D Tiles A-Frame Component
 *
 * Uses the Vite-bundled three-loader-3dtiles (via window.loadGoogleTiles)
 * to load Google Photorealistic 3D Tiles — the same library Kieran Farr
 * uses in his demos.
 *
 * Strategy: always render fallback scene first, then layer real tiles on top.
 */

AFRAME.registerComponent('google-3dtiles', {
  schema: {
    lat: { type: 'number', default: 40.7608 },
    lng: { type: 'number', default: -73.9941 },
    height: { type: 'number', default: 0 },
  },

  init: function () {
    this.tilesRuntime = null;
    this.tilesModel = null;
    this.fallbackEl = null;

    // Always show fallback scene first
    this._loadFallbackScene();
    this._signalReady();

    // Then attempt real Google 3D Tiles
    var apiKey = this._getApiKey();
    if (apiKey) {
      this._attemptGoogleTiles(apiKey);
    }
  },

  _getApiKey: function () {
    if (window.WANDERVIEW_GOOGLE_API_KEY) return window.WANDERVIEW_GOOGLE_API_KEY;
    var metaTag = document.querySelector('meta[name="google-api-key"]');
    if (metaTag && metaTag.content) return metaTag.content;
    return window.GOOGLE_API_KEY || '';
  },

  _attemptGoogleTiles: function (apiKey) {
    var self = this;
    var sceneEl = this.el.sceneEl;

    function tryLoad() {
      // Wait for A-Frame renderer
      if (!sceneEl.renderer || !sceneEl.camera) {
        sceneEl.addEventListener('renderstart', tryLoad);
        return;
      }
      self._loadGoogleTiles(apiKey);
    }

    // Wait for Vite-bundled tiles loader to be ready
    if (window.loadGoogleTiles) {
      tryLoad();
    } else {
      window.addEventListener('tilesLoaderReady', tryLoad);
    }
  },

  _loadGoogleTiles: async function (apiKey) {
    var self = this;

    try {
      console.log('Loading Google Photorealistic 3D Tiles...');

      var result = await window.loadGoogleTiles({
        apiKey: apiKey,
        renderer: this.el.sceneEl.renderer,
        lat: this.data.lat,
        lng: this.data.lng,
        height: this.data.height,
      });

      // Add the tiles model to the scene
      this.el.sceneEl.object3D.add(result.model);
      this.tilesModel = result.model;
      this.tilesRuntime = result.runtime;

      // Hide fallback scene
      if (this.fallbackEl) {
        this.fallbackEl.setAttribute('visible', 'false');
      }

      console.log('Google 3D Tiles loaded successfully');
    } catch (err) {
      console.warn('Google 3D Tiles failed:', err.message);
      // Fallback scene stays visible
    }
  },

  _loadFallbackScene: function () {
    var container = document.createElement('a-entity');
    container.setAttribute('id', 'fallback-scene');
    this.el.appendChild(container);
    this.fallbackEl = container;

    // Ground plane
    var ground = document.createElement('a-plane');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('width', '2000');
    ground.setAttribute('height', '2000');
    ground.setAttribute('color', '#555555');
    ground.setAttribute('material', 'roughness: 0.9');
    container.appendChild(ground);

    this._createStreetGrid(container);
    this._createBuildings(container);
    console.log('Fallback scene loaded');
  },

  _createStreetGrid: function (parent) {
    var avenues = [
      { name: '9th Ave', offset: 0 },
      { name: '10th Ave', offset: -80 },
      { name: '11th Ave', offset: -160 },
    ];

    avenues.forEach(function (ave) {
      var line = document.createElement('a-plane');
      line.setAttribute('rotation', '-90 0 0');
      line.setAttribute('width', '15');
      line.setAttribute('height', '1000');
      line.setAttribute('position', ave.offset + ' 0.01 0');
      line.setAttribute('color', '#444444');
      line.setAttribute('material', 'roughness: 1');
      parent.appendChild(line);

      [-9, 9].forEach(function (sx) {
        var sidewalk = document.createElement('a-plane');
        sidewalk.setAttribute('rotation', '-90 0 0');
        sidewalk.setAttribute('width', '3');
        sidewalk.setAttribute('height', '1000');
        sidewalk.setAttribute('position', (ave.offset + sx) + ' 0.02 0');
        sidewalk.setAttribute('color', '#777777');
        parent.appendChild(sidewalk);
      });
    });

    for (var st = -5; st <= 5; st++) {
      var z = st * 80;
      var line = document.createElement('a-plane');
      line.setAttribute('rotation', '-90 0 0');
      line.setAttribute('width', '500');
      line.setAttribute('height', '12');
      line.setAttribute('position', '0 0.01 ' + z);
      line.setAttribute('color', '#444444');
      parent.appendChild(line);

      var label = document.createElement('a-text');
      var streetNum = 47 + st;
      label.setAttribute('value', streetNum + 'th St');
      label.setAttribute('position', '30 0.5 ' + z);
      label.setAttribute('color', '#ffffff');
      label.setAttribute('width', '20');
      label.setAttribute('align', 'center');
      parent.appendChild(label);
    }
  },

  _createBuildings: function (parent) {
    var colors = [
      '#8B4513', '#A0522D', '#D2691E', '#CD853F',
      '#BC8F8F', '#A9A9A9', '#808080', '#696969',
      '#B8860B', '#DAA520', '#C0C0C0', '#778899',
    ];

    for (var ax = 0; ax < 3; ax++) {
      for (var st = -5; st <= 4; st++) {
        var blockX = -ax * 80 - 40;
        var blockZ = st * 80 + 40;
        var count = 3 + Math.floor(Math.random() * 4);

        for (var b = 0; b < count; b++) {
          var bx = blockX + (Math.random() - 0.5) * 50;
          var bz = blockZ + (Math.random() - 0.5) * 50;
          var h = 15 + Math.random() * 50;
          var w = 8 + Math.random() * 15;
          var d = 8 + Math.random() * 15;
          var c = colors[Math.floor(Math.random() * colors.length)];

          var building = document.createElement('a-box');
          building.setAttribute('position', bx + ' ' + (h / 2) + ' ' + bz);
          building.setAttribute('width', '' + w);
          building.setAttribute('height', '' + h);
          building.setAttribute('depth', '' + d);
          building.setAttribute('color', c);
          building.setAttribute('material', 'roughness: 0.8; metalness: 0.1');
          parent.appendChild(building);

          if (h > 20) {
            for (var wy = 5; wy < h - 3; wy += 4) {
              var win = document.createElement('a-box');
              win.setAttribute('position', bx + ' ' + wy + ' ' + (bz - d / 2 - 0.05));
              win.setAttribute('width', '' + (w * 0.8));
              win.setAttribute('height', '1.5');
              win.setAttribute('depth', '0.1');
              var emissive = Math.random() > 0.3 ? 0.3 : 0;
              win.setAttribute('material', 'color: #ffd; emissive: #ffa; emissiveIntensity: ' + emissive + '; roughness: 0.2; metalness: 0.8');
              parent.appendChild(win);
            }
          }
        }
      }
    }
  },

  _signalReady: function () {
    window.dispatchEvent(new CustomEvent('tilesReady'));
    if (window.gameEngine) {
      window.gameEngine.setReady();
    }
  },

  tick: function (t, dt) {
    if (this.tilesRuntime) {
      try {
        this.tilesRuntime.update(dt, this.el.sceneEl.renderer, this.el.sceneEl.camera);
      } catch (err) {
        console.error('Tiles runtime error, disabling:', err.message);
        this.tilesRuntime = null;
        if (this.fallbackEl) {
          this.fallbackEl.setAttribute('visible', 'true');
        }
      }
    }
  },

  remove: function () {
    if (this.tilesRuntime) {
      try { this.tilesRuntime.dispose(); } catch (e) { /* ignore */ }
    }
    if (this.tilesModel && this.tilesModel.parent) {
      this.tilesModel.parent.remove(this.tilesModel);
    }
  },
});
