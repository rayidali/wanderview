/**
 * tiles-component.js — Google 3D Tiles A-Frame Component
 * Loads Google Photorealistic 3D Tiles and transforms them from
 * ECEF (Earth-Centered) coordinates to a local frame at Hell's Kitchen
 * so the player can walk at street level.
 */

AFRAME.registerComponent('google-3dtiles', {
  schema: {
    lat: { type: 'number', default: 40.7608 },
    lng: { type: 'number', default: -73.9941 },
  },

  init: function () {
    this.tilesRenderer = null;
    this.container = null;
    this.apiKey = this._getApiKey();

    if (!this.apiKey) {
      console.warn('Google 3D Tiles: No API key found — loading fallback scene.');
      this._loadFallbackScene();
      return;
    }

    this._loadTiles();
  },

  _getApiKey: function () {
    // Inline script in <head> sets this from Vite build env before this runs
    if (window.WANDERVIEW_GOOGLE_API_KEY) return window.WANDERVIEW_GOOGLE_API_KEY;

    var metaTag = document.querySelector('meta[name="google-api-key"]');
    if (metaTag && metaTag.content) return metaTag.content;

    return window.GOOGLE_API_KEY || '';
  },

  _loadTiles: async function () {
    var sceneEl = this.el.sceneEl;
    var camera = sceneEl.camera;
    var renderer = sceneEl.renderer;

    // A-Frame may not have camera/renderer ready yet
    if (!camera || !renderer) {
      var self = this;
      sceneEl.addEventListener('renderstart', function () {
        self._loadTiles();
      });
      return;
    }

    try {
      // Import 3d-tiles-renderer — main entry + plugins subpath
      // esm.sh handles dependency resolution (including Three.js)
      var results = await Promise.all([
        import('https://esm.sh/3d-tiles-renderer@0.4.21'),
        import('https://esm.sh/3d-tiles-renderer@0.4.21/plugins'),
      ]);

      var TilesRenderer = results[0].TilesRenderer;
      var GoogleCloudAuthPlugin = results[1].GoogleCloudAuthPlugin;

      if (!TilesRenderer || !GoogleCloudAuthPlugin) {
        throw new Error('TilesRenderer or GoogleCloudAuthPlugin not found in module exports');
      }

      // Create renderer with Google Photorealistic 3D Tiles auth
      var tiles = new TilesRenderer();
      tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: this.apiKey }));
      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, renderer);

      // --- ECEF → Local coordinate transformation ---
      // Google 3D Tiles are in ECEF (origin at Earth's center).
      // We transform so Hell's Kitchen sits at scene origin (0,0,0)
      // with East→+X, Up→+Y, South→+Z (A-Frame convention).
      var THREE = AFRAME.THREE;
      var lat = this.data.lat * Math.PI / 180;
      var lng = this.data.lng * Math.PI / 180;

      var sinLat = Math.sin(lat);
      var cosLat = Math.cos(lat);
      var sinLng = Math.sin(lng);
      var cosLng = Math.cos(lng);

      // WGS84 ellipsoid parameters
      var WGS84_A = 6378137.0;
      var e2 = 0.00669437999014;
      var N = WGS84_A / Math.sqrt(1 - e2 * sinLat * sinLat);

      // ECEF position of the target lat/lng (on the ellipsoid surface)
      var ecefX = N * cosLat * cosLng;
      var ecefY = N * cosLat * sinLng;
      var ecefZ = N * (1 - e2) * sinLat;

      // Combined rotation + translation matrix: ECEF → local ENU remapped to A-Frame
      // Row 0 (X/East):   [-sinLng,          cosLng,          0     ]
      // Row 1 (Y/Up):     [ cosLat*cosLng,    cosLat*sinLng,   sinLat]
      // Row 2 (Z/South):  [ sinLat*cosLng,    sinLat*sinLng,  -cosLat]
      // Translation = -(R * ecefPos)
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

      // Wrap tiles group in a container that applies the transform
      var container = new THREE.Group();
      container.matrixAutoUpdate = false;
      container.matrix.copy(transform);
      container.matrixWorldNeedsUpdate = true;
      container.add(tiles.group);

      this.el.sceneEl.object3D.add(container);

      this.tilesRenderer = tiles;
      this.container = container;

      console.log('Google 3D Tiles loaded for Hell\'s Kitchen');
      this._signalReady();
    } catch (err) {
      console.error('Failed to load Google 3D Tiles:', err);
      this._loadFallbackScene();
    }
  },

  _loadFallbackScene: function () {
    var el = this.el;

    // Ground plane
    var ground = document.createElement('a-plane');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('width', '2000');
    ground.setAttribute('height', '2000');
    ground.setAttribute('color', '#555555');
    ground.setAttribute('material', 'roughness: 0.9');
    el.appendChild(ground);

    this._createStreetGrid(el);
    this._createBuildings(el);

    console.log('Fallback scene loaded (no API key or tiles failed)');
    this._signalReady();
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
      label.setAttribute('rotation', '0 0 0');
      label.setAttribute('color', '#ffffff');
      label.setAttribute('width', '20');
      label.setAttribute('align', 'center');
      parent.appendChild(label);
    }
  },

  _createBuildings: function (parent) {
    var buildingColors = [
      '#8B4513', '#A0522D', '#D2691E', '#CD853F',
      '#BC8F8F', '#A9A9A9', '#808080', '#696969',
      '#B8860B', '#DAA520', '#C0C0C0', '#778899',
    ];

    for (var ax = 0; ax < 3; ax++) {
      for (var st = -5; st <= 4; st++) {
        var blockX = -ax * 80 - 40;
        var blockZ = st * 80 + 40;

        var buildingsPerBlock = 3 + Math.floor(Math.random() * 4);
        for (var b = 0; b < buildingsPerBlock; b++) {
          var bx = blockX + (Math.random() - 0.5) * 50;
          var bz = blockZ + (Math.random() - 0.5) * 50;
          var height = 15 + Math.random() * 50;
          var width = 8 + Math.random() * 15;
          var depth = 8 + Math.random() * 15;
          var color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

          var building = document.createElement('a-box');
          building.setAttribute('position', bx + ' ' + (height / 2) + ' ' + bz);
          building.setAttribute('width', '' + width);
          building.setAttribute('height', '' + height);
          building.setAttribute('depth', '' + depth);
          building.setAttribute('color', color);
          building.setAttribute('material', 'roughness: 0.8; metalness: 0.1');
          parent.appendChild(building);

          if (height > 20) {
            for (var wy = 5; wy < height - 3; wy += 4) {
              var windowStrip = document.createElement('a-box');
              windowStrip.setAttribute('position', bx + ' ' + wy + ' ' + (bz - depth / 2 - 0.05));
              windowStrip.setAttribute('width', '' + (width * 0.8));
              windowStrip.setAttribute('height', '1.5');
              windowStrip.setAttribute('depth', '0.1');
              windowStrip.setAttribute('material', 'color: #ffd; emissive: #ffa; emissiveIntensity: ' + (Math.random() > 0.3 ? 0.3 : 0) + '; roughness: 0.2; metalness: 0.8');
              parent.appendChild(windowStrip);
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
    if (this.tilesRenderer) {
      var camera = this.el.sceneEl.camera;
      if (camera) {
        this.tilesRenderer.setCamera(camera);
        this.tilesRenderer.update();
      }
    }
  },

  remove: function () {
    if (this.tilesRenderer) {
      this.tilesRenderer.dispose();
    }
    if (this.container && this.container.parent) {
      this.container.parent.remove(this.container);
    }
  },
});
