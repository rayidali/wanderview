import React from 'react';

const MODES = [
  {
    id: 'explorer',
    name: 'Explorer Mode',
    description: 'Free walk through the neighborhood. The AI narrates as you explore.',
  },
  {
    id: 'scavenger',
    name: 'Scavenger Hunt',
    description: 'Find specific places and landmarks. Race against the clock!',
  },
  {
    id: 'history',
    name: 'History Tour',
    description: 'Learn the rich history of every block — gangs, theaters, immigrants, and more.',
  },
  {
    id: 'mystery',
    name: 'Mystery Mode',
    description: 'A noir detective story unfolds as you walk. Find clues, solve the case.',
  },
];

export default function ModeSelector({ visible, onSelect }) {
  if (!visible) return null;

  return (
    <div className="mode-selector interactive">
      <h2>Choose Your Adventure</h2>
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className="mode-option"
          onClick={() => onSelect(mode.id)}
        >
          <span className="mode-name">{mode.name}</span>
          <span className="mode-desc">{mode.description}</span>
        </button>
      ))}
    </div>
  );
}
