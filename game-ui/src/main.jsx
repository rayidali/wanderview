import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './tiles-loader.js';

ReactDOM.createRoot(document.getElementById('game-ui')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
