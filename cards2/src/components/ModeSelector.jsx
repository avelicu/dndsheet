import React from 'react';
import './ModeSelector.css';

const ModeSelector = ({ mode, onModeChange }) => {
  return (
    <div className="mode-selector">
      <h3 className="selector-group-header">Card Type</h3>
      <div className="mode-buttons">
        <button 
          className={`mode-button ${mode === 'spells' ? 'active' : ''}`}
          onClick={() => onModeChange('spells')}
        >
          Spell Cards
        </button>
        <button 
          className={`mode-button ${mode === 'creatures' ? 'active' : ''}`}
          onClick={() => onModeChange('creatures')}
        >
          Creature Cards
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;

