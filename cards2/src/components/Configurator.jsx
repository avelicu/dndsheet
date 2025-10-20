import React, { useState, useEffect } from 'react';
import ClassSelector from './ClassSelector';
import LevelSelector from './LevelSelector';
import LayoutSelector from './LayoutSelector';
import { useSpellData } from '../utils/useSpellData';
import stateManager from '../utils/stateManager';
import './Configurator.css';

const Configurator = ({ onSelectionChange, onLayoutChange }) => {
  const { spells, classes, levels, filterSpells, loading, error } = useSpellData();
  
  // Initialize with saved state
  const initialState = stateManager.getState();
  const [selectedClasses, setSelectedClasses] = useState(initialState.spellSelection.selectedClasses);
  const [selectedLevels, setSelectedLevels] = useState(initialState.spellSelection.selectedLevels);
  const [pageSize, setPageSize] = useState(initialState.layoutConfig.pageSize);
  const [cardSize, setCardSize] = useState(initialState.layoutConfig.cardSize || 'standard');

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      let filteredSpells = [];
      
      // AND logic: spells must match ALL selected classes AND ALL selected levels
      if (selectedClasses.length === 0 && selectedLevels.length === 0) {
        // No selections - show no spells
        filteredSpells = [];
      } else if (selectedClasses.length === 0) {
        // Only level filters - show no spells (need both class AND level)
        filteredSpells = [];
      } else if (selectedLevels.length === 0) {
        // Only class filters - show no spells (need both class AND level)
        filteredSpells = [];
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

  // Notify parent component of layout changes
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange({
        pageSize,
        cardSize
      });
    }
  }, [pageSize, cardSize, onLayoutChange]);

  const handleClassChange = (newSelectedClasses) => {
    setSelectedClasses(newSelectedClasses);
  };

  const handleLevelChange = (newSelectedLevels) => {
    setSelectedLevels(newSelectedLevels);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  if (loading) {
    return (
      <div className="configurator">
        <div className="loading">Loading spell data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="configurator">
        <div className="error">Error loading spell data: {error}</div>
      </div>
    );
  }

  return (
    <div className="configurator">
      <div className="configurator-content">
        <ClassSelector
          classes={classes}
          selectedClasses={selectedClasses}
          onClassChange={handleClassChange}
        />
        
        <LevelSelector
          levels={levels}
          selectedLevels={selectedLevels}
          onLevelChange={handleLevelChange}
        />
        
        <LayoutSelector
          pageSize={pageSize}
          cardSize={cardSize}
          onPageSizeChange={handlePageSizeChange}
          onCardSizeChange={setCardSize}
        />
      </div>
    </div>
  );
};

export default Configurator;
