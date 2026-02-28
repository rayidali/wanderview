/**
 * tiles-component.js — Google 3D Tiles A-Frame Component
 * Loads Google Photorealistic 3D Tiles into the A-Frame scene.
 * Uses Three.js directly with the Google 3D Tiles API.
 */

AFRAME.registerComponent('google-3dtiles', {
  schema: {
    apiKey: { type: 'string', default: '' },
    lat: { type: 'number', default: 40.7608 },
    lng: { type: 'number', default: -73.9941 },
  },

  init: function () {
    this.tilesRenderer = null;
    this.apiKey = this.data.apiKey || this._getApiKey();

    if (!this.apiKey) {
      console.warn('Google 3D Tiles: No API key found. Set VITE_GOOGLE_API_KEY or pass apiKey attribute.');
      this._loadFallbackScene();
      return;
    }

    this._loadTiles();
  },

  _getApiKey: function () {
    // Check window global (set by React app from Vite env vars)
    if (window.WANDERVIEW_GOOGLE_API_KEY) return window.WANDERVIEW_GOOGLE_API_KEY;

    // Check meta tag
    const metaTag = document.querySelector('meta[name="google-api-key"]');
    if (metaTag) return metaTag.content;

    return window.GOOGLE_API_KEY || '';
  },

  _loadTiles: async function () {
    const scene = this.el.sceneEl.object3D;
    const camera = this.el.sceneEl.camera;
    const renderer = this.el.sceneEl.renderer;

    try {
      // Dynamically import 3d-tiles-renderer
      const { TilesRenderer, GlobeControls, GoogleCloudAuthPlugin } =
        await import('https://cdn.jsdelivr.net/npm/3d-tiles-renderer@0.4.5/+esm');
      const { CesiumIonAuthPlugin } = await import('https://cdn.jsdelivr.net/npm/3d-tiles-renderer@0.4.5/+esm');

      // Create tiles renderer using Google endpoint
      const tiles = new TilesRenderer();
      tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: this.apiKey }));

      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, renderer);

      // Position on Hell's Kitchen
      const WGS84_A = 6378137.0;
      const WGS84_B = 6356752.314245;
      const lat = this.data.lat * Math.PI / 180;
      const lng = this.data.lng * Math.PI / 180;

      // Calculate ECEF from lat/lng
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      const sinLng = Math.sin(lng);
      const cosLng = Math.cos(lng);
      const e2 = 1 - (WGS84_B * WGS84_B) / (WGS84_A * WGS84_A);
      const N = WGS84_A / Math.sqrt(1 - e2 * sinLat * sinLat);

      scene.add(tiles.group);

      this.tilesRenderer = tiles;

      // Set up rendering loop
      this.el.sceneEl.addEventListener('enter-vr', () => {});

      console.log('Google 3D Tiles loaded for WanderView');
      this._signalReady();
    } catch (err) {
      console.error('Failed to load 3D Tiles renderer:', err);
      this._loadFallbackScene();
    }
  },

  _loadFallbackScene: function () {
    // Create a ground plane and simple buildings as fallback
    const el = this.el;

    // Ground plane — street level
    const ground = document.createElement('a-plane');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('width', '2000');
    ground.setAttribute('height', '2000');
    ground.setAttribute('color', '#555555');
    ground.setAttribute('material', 'roughness: 0.9');
    el.appendChild(ground);

    // Grid lines for streets
    this._createStreetGrid(el);

    // Procedural buildings for Hell's Kitchen blocks
    this._createBuildings(el);

    console.log('Fallback scene loaded (no API key)');
    this._signalReady();
  },

  _createStreetGrid: function (parent) {
    // Create avenue lines (N-S) — 9th Ave to 11th Ave
    const avenues = [
      { name: '9th Ave', offset: 0 },
      { name: '10th Ave', offset: -80 },
      { name: '11th Ave', offset: -160 },
    ];

    avenues.forEach((ave) => {
      const line = document.createElement('a-plane');
      line.setAttribute('rotation', '-90 0 0');
      line.setAttribute('width', '15');
      line.setAttribute('height', '1000');
      line.setAttribute('position', `${ave.offset} 0.01 0`);
      line.setAttribute('color', '#444444');
      line.setAttribute('material', 'roughness: 1');
      parent.appendChild(line);

      // Sidewalks
      [-9, 9].forEach((sx) => {
        const sidewalk = document.createElement('a-plane');
        sidewalk.setAttribute('rotation', '-90 0 0');
        sidewalk.setAttribute('width', '3');
        sidewalk.setAttribute('height', '1000');
        sidewalk.setAttribute('position', `${ave.offset + sx} 0.02 0`);
        sidewalk.setAttribute('color', '#777777');
        parent.appendChild(sidewalk);
      });
    });

    // Create street lines (E-W) — 42nd to 52nd
    for (let st = -5; st <= 5; st++) {
      const z = st * 80;
      const line = document.createElement('a-plane');
      line.setAttribute('rotation', '-90 0 0');
      line.setAttribute('width', '500');
      line.setAttribute('height', '12');
      line.setAttribute('position', `0 0.01 ${z}`);
      line.setAttribute('color', '#444444');
      parent.appendChild(line);

      // Street label
      const label = document.createElement('a-text');
      const streetNum = 47 + st;
      label.setAttribute('value', `${streetNum}th St`);
      label.setAttribute('position', `30 0.5 ${z}`);
      label.setAttribute('rotation', '0 0 0');
      label.setAttribute('color', '#ffffff');
      label.setAttribute('width', '20');
      label.setAttribute('align', 'center');
      parent.appendChild(label);
    }
  },

  _createBuildings: function (parent) {
    const buildingColors = [
      '#8B4513', '#A0522D', '#D2691E', '#CD853F',
      '#BC8F8F', '#A9A9A9', '#808080', '#696969',
      '#B8860B', '#DAA520', '#C0C0C0', '#778899',
    ];

    // Place buildings in blocks between streets and avenues
    for (let ax = 0; ax < 3; ax++) {
      for (let st = -5; st <= 4; st++) {
        const blockX = -ax * 80 - 40;
        const blockZ = st * 80 + 40;

        // Several buildings per block
        const buildingsPerBlock = 3 + Math.floor(Math.random() * 4);
        for (let b = 0; b < buildingsPerBlock; b++) {
          const bx = blockX + (Math.random() - 0.5) * 50;
          const bz = blockZ + (Math.random() - 0.5) * 50;
          const height = 15 + Math.random() * 50;
          const width = 8 + Math.random() * 15;
          const depth = 8 + Math.random() * 15;
          const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

          const building = document.createElement('a-box');
          building.setAttribute('position', `${bx} ${height / 2} ${bz}`);
          building.setAttribute('width', width);
          building.setAttribute('height', height);
          building.setAttribute('depth', depth);
          building.setAttribute('color', color);
          building.setAttribute('material', 'roughness: 0.8; metalness: 0.1');
          parent.appendChild(building);

          // Windows (simple emissive strips)
          if (height > 20) {
            for (let wy = 5; wy < height - 3; wy += 4) {
              const windowStrip = document.createElement('a-box');
              windowStrip.setAttribute('position', `${bx} ${wy} ${bz - depth / 2 - 0.05}`);
              windowStrip.setAttribute('width', width * 0.8);
              windowStrip.setAttribute('height', 1.5);
              windowStrip.setAttribute('depth', 0.1);
              windowStrip.setAttribute('material', `color: #ffd; emissive: #ffa; emissiveIntensity: ${Math.random() > 0.3 ? 0.3 : 0}; roughness: 0.2; metalness: 0.8`);
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
      const camera = this.el.sceneEl.camera;
      this.tilesRenderer.setCamera(camera);
      this.tilesRenderer.update();
    }
  },

  remove: function () {
    if (this.tilesRenderer) {
      this.tilesRenderer.dispose();
    }
  },
});
