import React from 'react';
import './LevelSelector.css';
import './SelectorCommon.css';

const LevelSelector = ({ levels, selectedLevels, onLevelChange }) => {
  const handleLevelChange = (level, isChecked) => {
    if (isChecked) {
      onLevelChange([...selectedLevels, level]);
    } else {
      onLevelChange(selectedLevels.filter(lvl => lvl !== level));
    }
  };

  const formatLevel = (level) => {
    if (level === 0) return 'Cantrip';
    const j = level % 10;
    const k = level % 100;
    if (j === 1 && k !== 11) return `${level}st Level`;
    if (j === 2 && k !== 12) return `${level}nd Level`;
    if (j === 3 && k !== 13) return `${level}rd Level`;
    return `${level}th Level`;
  };

  return (
    <div className="level-selector">
      <h3 className="selector-group-header">Spell Levels</h3>
      <div className="selector-selection-count">
        {selectedLevels.length} selected
      </div>
      <ul className="selector-checkbox-list">
        {levels.map(level => (
          <li key={level}>
            <label className="selector-checkbox-label">
              <input
                type="checkbox"
                checked={selectedLevels.includes(level)}
                onChange={(e) => handleLevelChange(level, e.target.checked)}
              />
              <span className="selector-checkbox-text">{formatLevel(level)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LevelSelector;
