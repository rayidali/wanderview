import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function HUD({ position, gameMode, score }) {
  const [street, setStreet] = useState({ street: '46th St', avenue: '9th Ave' });
  const [heading, setHeading] = useState(0);
  const [landmarks, setLandmarks] = useState([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!position || !window.gameNavigation) return;

    setStreet(window.gameNavigation.getCurrentStreet(position.lat, position.lng));
    setHeading(position.heading || 0);
    setLandmarks(window.gameNavigation.getNearbyLandmarks(position.lat, position.lng, 300));
  }, [position]);

  // Minimap toggle
  useEffect(() => {
    const handler = () => setShowMinimap((prev) => !prev);
    window.addEventListener('toggleMinimap', handler);
    return () => window.removeEventListener('toggleMinimap', handler);
  }, []);

  // Draw minimap
  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !position || !window.gameNavigation) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Scale: 1 degree lat ≈ 111km, we want ~400m to fill the minimap
    const scale = w / 0.005; // ~500m visible

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
    ctx.fillRect(0, 0, w, h);

    // Draw street grid
    const nav = window.gameNavigation;
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    ctx.lineWidth = 1;

    // East-West streets
    nav.STREETS.eastWest.forEach((st) => {
      const dy = (st.lat - position.lat) * scale;
      const y = centerY - dy;
      if (y > 0 && y < h) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px monospace';
        ctx.fillText(st.name, 4, y - 2);
      }
    });

    // North-South avenues
    nav.STREETS.northSouth.forEach((ave) => {
      const dx = (ave.lng - position.lng) * scale;
      const x = centerX + dx;
      if (x > 0 && x < w) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    });

    // Draw landmarks
    nav.LANDMARKS.forEach((lm) => {
      const dx = (lm.lng - position.lng) * scale;
      const dy = (lm.lat - position.lat) * scale;
      const x = centerX + dx;
      const y = centerY - dy;

      if (x > 5 && x < w - 5 && y > 5 && y < h - 5) {
        ctx.fillStyle = '#f7c948';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player dot
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Player heading indicator
    const headingRad = -(heading * Math.PI) / 180 + Math.PI / 2;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(headingRad) * 15,
      centerY - Math.sin(headingRad) * 15
    );
    ctx.stroke();
  }, [position, heading]);

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  const compassDirection = window.gameNavigation?.getCompassDirection(heading) || 'N';

  const modeLabels = {
    explorer: 'Explorer Mode',
    scavenger: 'Scavenger Hunt',
    history: 'History Tour',
    mystery: 'Mystery Mode',
  };

  return (
    <>
      {/* Score — top left */}
      <div className="hud">
        <div className="hud-score">
          <div className="score-label">Score</div>
          <div className="score-value">{score}</div>
        </div>
        <div className="hud-mode">{modeLabels[gameMode] || 'Explorer Mode'}</div>
      </div>

      {/* Compass — top right */}
      <div className="compass">
        <div className="compass-circle">
          <div
            className="compass-needle"
            style={{ transform: `rotate(${-heading}deg)` }}
          />
          <div className="compass-label">{compassDirection}</div>
        </div>
      </div>

      {/* Location Info — bottom left */}
      <div className="location-info">
        <div className="location-card">
          <div className="location-street">
            {street.street} & {street.avenue}
          </div>
          <div className="location-coords">
            {position?.lat?.toFixed(4)}, {position?.lng?.toFixed(4)}
          </div>
          {landmarks.length > 0 && (
            <div className="location-landmarks">
              {landmarks.slice(0, 2).map((lm) => (
                <div key={lm.name}>
                  {lm.icon} {lm.name} — {lm.distance}m
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Minimap — bottom right */}
      <div className={`minimap interactive ${!showMinimap ? 'hidden' : ''}`}>
        <canvas ref={canvasRef} width={180} height={180} />
      </div>

      {/* Crosshair */}
      <div className="crosshair" />
    </>
  );
}
