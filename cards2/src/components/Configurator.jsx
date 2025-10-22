import React, { useState, useEffect } from 'react';
import ClassSelector from './ClassSelector';
import LevelSelector from './LevelSelector';
import LayoutSelector from './LayoutSelector';
import AdditionalSpells from './AdditionalSpells';
import { useSpellData } from '../utils/useSpellData';
import stateManager from '../utils/stateManager';
import './Configurator.css';

const Configurator = ({ onSelectionChange, onLayoutChange }) => {
  const { spells, classes, levels, filterSpells, loading, error } = useSpellData();
  
  // Initialize with saved state - only once
  const [selectedClasses, setSelectedClasses] = useState(() => {
    const initialState = stateManager.getState();
    return initialState.spellSelection.selectedClasses;
  });
  const [selectedLevels, setSelectedLevels] = useState(() => {
    const initialState = stateManager.getState();
    return initialState.spellSelection.selectedLevels;
  });
  const [pageSize, setPageSize] = useState(() => {
    const initialState = stateManager.getState();
    return initialState.layoutConfig.pageSize;
  });
  const [cardSize, setCardSize] = useState(() => {
    const initialState = stateManager.getState();
    return initialState.layoutConfig.cardSize || 'standard';
  });

  // Additional spells selection (by name)
  const [additionalSpellNames, setAdditionalSpellNames] = useState(() => {
    const initialState = stateManager.getState();
    return initialState.spellSelection.additionalSpellNames || [];
  });
  const [activeFilteredSpellNames, setActiveFilteredSpellNames] = useState(new Set());

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      let filteredSpells = [];
      
      // AND logic: spells must match ALL selected classes AND ALL selected levels
      if (selectedClasses.length === 0 && selectedLevels.length === 0) {
        filteredSpells = [];
      } else if (selectedClasses.length === 0) {
        filteredSpells = [];
      } else if (selectedLevels.length === 0) {
        filteredSpells = [];
      } else {
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

      // Build active set for the AdditionalSpells panel (for greying out)
      const activeNames = new Set(filteredSpells.map(s => s.name));
      setActiveFilteredSpellNames(activeNames);

      // Merge in additional spells by name, avoiding duplicates
      const addByName = new Set(additionalSpellNames);
      const additional = spells.filter(s => addByName.has(s.name) && !activeNames.has(s.name));
      const finalSpells = filteredSpells.concat(additional)
        .sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name));

      // Emit ONLY final list
      onSelectionChange({
        spells: finalSpells,
        spellCount: finalSpells.length
      });
    }
  // Intentionally exclude onSelectionChange to avoid identity-triggered loops
  }, [selectedClasses, selectedLevels, filterSpells, additionalSpellNames, spells]);

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
    const currentState = stateManager.getState();
    stateManager.updateSpellSelection({
      ...currentState.spellSelection,
      selectedClasses: newSelectedClasses,
      additionalSpellNames // persist alongside
    });
  };

  const handleLevelChange = (newSelectedLevels) => {
    setSelectedLevels(newSelectedLevels);
    const currentState = stateManager.getState();
    stateManager.updateSpellSelection({
      ...currentState.spellSelection,
      selectedLevels: newSelectedLevels,
      additionalSpellNames
    });
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    const currentState = stateManager.getState();
    stateManager.updateLayoutConfig({
      ...currentState.layoutConfig,
      pageSize: newPageSize
    });
  };

  const handleCardSizeChange = (newCardSize) => {
    setCardSize(newCardSize);
    const currentState = stateManager.getState();
    stateManager.updateLayoutConfig({
      ...currentState.layoutConfig,
      cardSize: newCardSize
    });
  };

  const handleAdditionalSpellsChange = (names) => {
    setAdditionalSpellNames(names);
    const currentState = stateManager.getState();
    stateManager.updateSpellSelection({
      ...currentState.spellSelection,
      additionalSpellNames: names
    });
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
        
        <AdditionalSpells
          allSpells={spells}
          activeSpellNames={activeFilteredSpellNames}
          selectedNames={additionalSpellNames}
          onChange={handleAdditionalSpellsChange}
        />
        
        <LayoutSelector
          pageSize={pageSize}
          cardSize={cardSize}
          onPageSizeChange={handlePageSizeChange}
          onCardSizeChange={handleCardSizeChange}
        />
      </div>
    </div>
  );
};

export default Configurator;
