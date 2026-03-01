/**
 * tiles-loader.js — Vite-bundled bridge for three-loader-3dtiles
 *
 * This module is imported by main.jsx so Vite bundles it properly
 * with all Three.js dependencies resolved. It exposes a global
 * function that the vanilla JS A-Frame tiles component can call.
 */

import { Loader3DTiles } from 'three-loader-3dtiles';

window.loadGoogleTiles = async function (options) {
  const { apiKey, renderer, lat, lng, height } = options;

  const result = await Loader3DTiles.load({
    url: 'https://tile.googleapis.com/v1/3dtiles/root.json',
    renderer: renderer,
    options: {
      googleApiKey: apiKey,
      lat: lat,
      long: lng,
      height: height || 0,
      geoTransform: 'Mercator',
      maximumScreenSpaceError: 48,
      maximumMemoryUsage: 128,
      updateTransforms: true,
      dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
      basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/',
    },
  });

  return {
    model: result.model,
    runtime: result.runtime,
  };
};

window.dispatchEvent(new CustomEvent('tilesLoaderReady'));
