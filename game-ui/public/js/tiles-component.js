/**
 * tiles-component.js — Google 3D Tiles A-Frame Component
 *
 * Strategy: ALWAYS render the fallback scene (ground + buildings) first
 * so the user sees something immediately. Then attempt to load Google
 * Photorealistic 3D Tiles on top. If tiles load, hide the fallback.
 * If they fail, the fallback stays visible.
 */

AFRAME.registerComponent('google-3dtiles', {
  schema: {
    lat: { type: 'number', default: 40.7608 },
    lng: { type: 'number', default: -73.9941 },
  },

  init: function () {
    this.tilesRenderer = null;
    this.container = null;
    this.fallbackEl = null;
    this.tilesWorking = false;

    // ALWAYS load fallback scene first so user sees something
    this._loadFallbackScene();
    this._signalReady();

    // Then try to load real 3D tiles on top
    var apiKey = this._getApiKey();
    if (apiKey) {
      this._loadTiles(apiKey);
    }
  },

  _getApiKey: function () {
    if (window.WANDERVIEW_GOOGLE_API_KEY) return window.WANDERVIEW_GOOGLE_API_KEY;
    var metaTag = document.querySelector('meta[name="google-api-key"]');
    if (metaTag && metaTag.content) return metaTag.content;
    return window.GOOGLE_API_KEY || '';
  },

  _loadTiles: async function (apiKey) {
    var sceneEl = this.el.sceneEl;
    var self = this;

    // Wait for A-Frame renderer to be ready
    function waitForRenderer() {
      return new Promise(function (resolve) {
        if (sceneEl.camera && sceneEl.renderer) {
          resolve();
        } else {
          sceneEl.addEventListener('renderstart', resolve);
        }
      });
    }

    try {
      await waitForRenderer();

      var camera = sceneEl.camera;
      var renderer = sceneEl.renderer;

      // Import 3d-tiles-renderer from esm.sh
      // Pin Three.js version to match A-Frame 1.6.0 (r169) to minimize conflicts
      var results = await Promise.all([
        import('https://esm.sh/3d-tiles-renderer@0.4.21?external=three'),
        import('https://esm.sh/3d-tiles-renderer@0.4.21/plugins?external=three'),
      ]);

      var TilesRenderer = results[0].TilesRenderer;
      var GoogleCloudAuthPlugin = results[1].GoogleCloudAuthPlugin;

      if (!TilesRenderer || !GoogleCloudAuthPlugin) {
        throw new Error('TilesRenderer or GoogleCloudAuthPlugin not found');
      }

      var tiles = new TilesRenderer();
      tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey }));
      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, renderer);

      // ECEF → Local coordinate transformation
      var THREE = AFRAME.THREE;
      var lat = this.data.lat * Math.PI / 180;
      var lng = this.data.lng * Math.PI / 180;
      var sinLat = Math.sin(lat), cosLat = Math.cos(lat);
      var sinLng = Math.sin(lng), cosLng = Math.cos(lng);

      var WGS84_A = 6378137.0;
      var e2 = 0.00669437999014;
      var N = WGS84_A / Math.sqrt(1 - e2 * sinLat * sinLat);
      var ecefX = N * cosLat * cosLng;
      var ecefY = N * cosLat * sinLng;
      var ecefZ = N * (1 - e2) * sinLat;

      var tx = -sinLng * ecefX + cosLng * ecefY;
      var ty = cosLat * cosLng * ecefX + cosLat * sinLng * ecefY + sinLat * ecefZ;
      var tz = sinLat * cosLng * ecefX + sinLat * sinLng * ecefY - cosLat * ecefZ;

      var transform = new THREE.Matrix4();
      transform.set(
        -sinLng,          cosLng,           0,       -tx,
         cosLat * cosLng,  cosLat * sinLng,  sinLat,  -ty,
         sinLat * cosLng,  sinLat * sinLng, -cosLat,  -tz,
         0,                0,                0,         1
      );

      var container = new THREE.Group();
      container.matrixAutoUpdate = false;
      container.matrix.copy(transform);
      container.matrixWorldNeedsUpdate = true;
      container.add(tiles.group);

      sceneEl.object3D.add(container);

      self.tilesRenderer = tiles;
      self.container = container;
      self.tilesWorking = true;

      // Hide fallback scene after tiles start loading
      if (self.fallbackEl) {
        self.fallbackEl.setAttribute('visible', 'false');
      }

      console.log('Google 3D Tiles initialized for Hell\'s Kitchen');
    } catch (err) {
      console.warn('Google 3D Tiles failed to load, keeping fallback scene:', err.message);
      // Fallback scene is already visible — no action needed
    }
  },

  _loadFallbackScene: function () {
    // Create a container entity for all fallback geometry
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

  tick: function () {
    // Only update tiles renderer if it was successfully created
    // Wrap in try/catch so a crash here doesn't kill A-Frame's render loop
    if (this.tilesRenderer && this.tilesWorking) {
      try {
        var camera = this.el.sceneEl.camera;
        if (camera) {
          this.tilesRenderer.setCamera(camera);
          this.tilesRenderer.update();
        }
      } catch (err) {
        // Tiles renderer is corrupting the render loop — disable it
        console.error('Tiles renderer crashed, disabling:', err.message);
        this.tilesWorking = false;
        // Show fallback scene again
        if (this.fallbackEl) {
          this.fallbackEl.setAttribute('visible', 'true');
        }
      }
    }
  },

  remove: function () {
    if (this.tilesRenderer) {
      try { this.tilesRenderer.dispose(); } catch (e) { /* ignore */ }
    }
    if (this.container && this.container.parent) {
      this.container.parent.remove(this.container);
    }
  },
});
