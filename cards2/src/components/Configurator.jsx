import React, { useState, useEffect } from 'react';
import ClassSelector from './ClassSelector';
import LevelSelector from './LevelSelector';
import LayoutSelector from './LayoutSelector';
import AdditionalSpells from './AdditionalSpells';
import { SourceSelector } from './SourceSelector';
import ModeSelector from './ModeSelector';
import CreatureSelector from './CreatureSelector';
import { useSpellData } from '../utils/useSpellData';
import { useCreatureData } from '../utils/useCreatureData';
import { SpellToCardDataTransformer } from '../utils/SpellToCardDataTransformer';
import { CreatureToCardDataTransformer } from '../utils/CreatureToCardDataTransformer';
import stateManager from '../utils/stateManager';
import './Configurator.css';

const Configurator = ({ cardMode, onCardModeChange, onSelectionChange, onLayoutChange, enabledSources = [], onSourcesChange, selectedSources = [], hasUserChoice = false, creatureSelection, updateCreatureSelection }) => {
  const { spells, classes, levels, filterSpells, loading: spellsLoading, error: spellsError } = useSpellData(enabledSources);
  const { creatures, types, sizes, challengeRatings, filterCreatures, loading: creaturesLoading, error: creaturesError } = useCreatureData();
  
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
  
  // Creature selection state - initialize from persisted state
  const [selectedTypes, setSelectedTypes] = useState(() => {
    if (creatureSelection) {
      return creatureSelection.selectedTypes || [];
    }
    const initialState = stateManager.getState();
    return initialState.creatureSelection.selectedTypes || [];
  });
  const [selectedCR, setSelectedCR] = useState(() => {
    if (creatureSelection) {
      return creatureSelection.selectedCR || '';
    }
    const initialState = stateManager.getState();
    return initialState.creatureSelection.selectedCR || '';
  });

  // Handle spell selection and transformation
  useEffect(() => {
    if (cardMode === 'spells' && onSelectionChange) {
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

      // Transform to cards
      const cardData = SpellToCardDataTransformer.transformArray(finalSpells);

      // Emit cards
      onSelectionChange({
        cards: cardData,
        cardCount: cardData.length
      });
    }
  // Intentionally exclude onSelectionChange to avoid identity-triggered loops
  }, [cardMode, selectedClasses, selectedLevels, filterSpells, additionalSpellNames, spells, onSelectionChange]);

  // Persist creature selection to state
  useEffect(() => {
    if (updateCreatureSelection) {
      updateCreatureSelection({
        selectedTypes,
        selectedCR
      });
    }
  }, [selectedTypes, selectedCR, updateCreatureSelection]);

  // Handle creature selection and transformation
  useEffect(() => {
    if (cardMode === 'creatures' && onSelectionChange) {
      // If no filters are selected, show nothing
      if (!selectedCR && selectedTypes.length === 0) {
        onSelectionChange({
          cards: [],
          cardCount: 0
        });
        return;
      }
      
      // If there are no types selected, show nothing (AND logic)
      if (selectedTypes.length === 0) {
        onSelectionChange({
          cards: [],
          cardCount: 0
        });
        return;
      }
      
      // Handle CR range filtering
      let filtered = creatures;
      if (selectedCR) {
        const parseCR = (cr) => {
          if (typeof cr === 'string' && cr.includes('/')) {
            const [num, den] = cr.split('/').map(Number);
            return num / den;
          }
          return Number(cr);
        };
        
        if (selectedCR.includes('-')) {
          const [minCRStr, maxCRStr] = selectedCR.split('-');
          
          // Convert fraction symbols to numeric values
          const convertFractionSymbol = (str) => {
            if (str === '∞') return Infinity;
            if (str === '⅛') return 0.125;
            if (str === '¼') return 0.25;
            if (str === '½') return 0.5;
            if (str === '¾') return 0.75;
            if (str === '') return 0;
            return parseCR(str);
          };
          
          const minCR = convertFractionSymbol(minCRStr);
          const maxCR = convertFractionSymbol(maxCRStr);
          
          console.log(`Filtering creatures: CR range ${minCRStr}-${maxCRStr} (${minCR}-${maxCR})`);
          
          filtered = creatures.filter(c => {
            const cr = parseCR(c.challengeRating);
            const isInRange = cr >= minCR && cr <= maxCR;
            return isInRange;
          });
          
          console.log(`Filtered to ${filtered.length} creatures`);
        } else {
          filtered = filterCreatures(selectedCR || null, null, null);
        }
      }
      
      // Apply type filter
      if (selectedTypes.length > 0) {
        console.log(`Applying type filter: ${selectedTypes.join(', ')}`);
        const beforeCount = filtered.length;
        filtered = filtered.filter(c => selectedTypes.includes(c.type));
        console.log(`After type filter: ${filtered.length} creatures (was ${beforeCount})`);
      }
      
      console.log(`Final filtered count: ${filtered.length} creatures`);
      
      // Transform to cards
      const cardData = CreatureToCardDataTransformer.transformArray(filtered);
      
      onSelectionChange({
        cards: cardData,
        cardCount: cardData.length
      });
    }
  }, [cardMode, selectedCR, selectedTypes, creatures, filterCreatures, onSelectionChange]);
  
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

  const loading = cardMode === 'spells' ? spellsLoading : creaturesLoading;
  const error = cardMode === 'spells' ? spellsError : creaturesError;

  return (
    <div className="configurator">
      <ModeSelector mode={cardMode} onModeChange={onCardModeChange} />
      <div className="configurator-content">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : error ? (
          <div className="error">Error loading data: {error}</div>
        ) : (
          <>
            {cardMode === 'spells' && (
              <SourceSelector 
                onSourcesChange={onSourcesChange}
                selectedSources={selectedSources}
                hasUserChoice={hasUserChoice}
              />
            )}
            {cardMode === 'spells' ? (
              <>
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
              </>
            ) : (
              <>
                <CreatureSelector
                  types={types}
                  challengeRatings={challengeRatings}
                  selectedTypes={selectedTypes}
                  selectedCR={selectedCR}
                  onTypesChange={setSelectedTypes}
                  onCRChange={setSelectedCR}
                />
                <LayoutSelector
                  pageSize={pageSize}
                  cardSize={cardSize}
                  onPageSizeChange={handlePageSizeChange}
                  onCardSizeChange={handleCardSizeChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Configurator;
