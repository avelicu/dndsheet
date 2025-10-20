import React, { useState, useEffect } from 'react';
import { useSpellData } from '../utils/useSpellData';
import './ClassLevelSelector.css';

const ClassLevelSelector = ({ onSelectionChange }) => {
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  
  const { 
    classes, 
    levels, 
    loading, 
    error, 
    filterSpells 
  } = useSpellData();

  // Handle class checkbox changes
  const handleClassChange = (className, isChecked) => {
    if (isChecked) {
      setSelectedClasses(prev => [...prev, className]);
    } else {
      setSelectedClasses(prev => prev.filter(cls => cls !== className));
    }
  };

  // Handle level checkbox changes
  const handleLevelChange = (level, isChecked) => {
    if (isChecked) {
      setSelectedLevels(prev => [...prev, level]);
    } else {
      setSelectedLevels(prev => prev.filter(lvl => lvl !== level));
    }
  };

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      let filteredSpells = [];
      
      // AND logic: spells must match ALL selected classes AND ALL selected levels
      if (selectedClasses.length === 0 && selectedLevels.length === 0) {
        // No selections - show no spells
        filteredSpells = [];
      } else if (selectedClasses.length === 0) {
        // Only level filters - show spells that match ANY selected level
        filteredSpells = selectedLevels.flatMap(level => 
          filterSpells('', level)
        );
        // Remove duplicates
        filteredSpells = filteredSpells.filter((spell, index, self) => 
          index === self.findIndex(s => s.name === spell.name)
        );
      } else if (selectedLevels.length === 0) {
        // Only class filters - show spells that match ANY selected class
        filteredSpells = selectedClasses.flatMap(className => 
          filterSpells(className, null)
        );
        // Remove duplicates
        filteredSpells = filteredSpells.filter((spell, index, self) => 
          index === self.findIndex(s => s.name === spell.name)
        );
      } else {
        // Both class and level filters - show spells that match ANY selected class AND ANY selected level
        filteredSpells = selectedClasses.flatMap(className => 
          selectedLevels.flatMap(level => 
            filterSpells(className, level)
          )
        );
        // Remove duplicates
        filteredSpells = filteredSpells.filter((spell, index, self) => 
          index === self.findIndex(s => s.name === spell.name)
        );
      }

      onSelectionChange({
        selectedClasses,
        selectedLevels,
        filteredSpells,
        spellCount: filteredSpells.length
      });
    }
  }, [selectedClasses, selectedLevels, filterSpells, onSelectionChange]);

  const formatLevelDisplay = (level) => {
    if (level === 0) return 'Cantrip';
    return `${level}${getOrdinalSuffix(level)} Level`;
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  if (loading) {
    return (
      <div className="class-level-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading spell data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-level-selector error">
        <p>Error loading spell data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="class-level-selector">
      <div className="selector-groups">
        <div className="selector-group">
          <div className="group-header">
            <h3>Classes</h3>
            <span className="selection-count">
              {selectedClasses.length} selected
            </span>
          </div>
          <ul className="checkbox-list">
            {classes.map((className) => (
              <li key={className}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(className)}
                    onChange={(e) => handleClassChange(className, e.target.checked)}
                  />
                  <span className="checkbox-text">{className}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="selector-group">
          <div className="group-header">
            <h3>Spell Levels</h3>
            <span className="selection-count">
              {selectedLevels.length} selected
            </span>
          </div>
          <ul className="checkbox-list">
            {levels.map((level) => (
              <li key={level}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(level)}
                    onChange={(e) => handleLevelChange(level, e.target.checked)}
                  />
                  <span className="checkbox-text">{formatLevelDisplay(level)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClassLevelSelector;
