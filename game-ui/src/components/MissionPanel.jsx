import React, { useState, useEffect } from 'react';

export default function MissionPanel({ mission, position, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!mission || !position || !mission.target) return;

    // Calculate distance to target
    const dlat = (mission.target.lat - position.lat) * 111320;
    const dlng =
      (mission.target.lng - position.lng) *
      111320 *
      Math.cos((position.lat * Math.PI) / 180);
    const distance = Math.sqrt(dlat * dlat + dlng * dlng);

    // Progress based on proximity (starts tracking from 500m)
    const maxDist = 500;
    const pct = Math.max(0, Math.min(100, ((maxDist - distance) / maxDist) * 100));
    setProgress(pct);

    // Complete when within 30m
    if (distance < 30 && !completed) {
      setCompleted(true);
      if (onComplete) onComplete(mission);
    }
  }, [mission, position, completed, onComplete]);

  // Reset completed state when mission changes
  useEffect(() => {
    setCompleted(false);
    setProgress(0);
  }, [mission?.title]);

  if (!mission) return null;

  return (
    <div className="mission-panel">
      <div className="mission-card">
        <div className="mission-header">
          <span className="mission-icon">{completed ? '✅' : '🎯'}</span>
          <span className="mission-title">
            {completed ? 'Mission Complete!' : 'Current Mission'}
          </span>
        </div>
        <div className="mission-description">
          <strong>{mission.title}</strong>
          <br />
          {mission.description}
        </div>
        <div className="mission-progress">
          <div
            className="mission-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {mission.hint && !completed && (
          <div className="mission-hint">{mission.hint}</div>
        )}
        {completed && mission.reward && (
          <div className="mission-hint" style={{ color: '#f7c948' }}>
            +{mission.reward} points!
          </div>
        )}
      </div>
    </div>
  );
}
