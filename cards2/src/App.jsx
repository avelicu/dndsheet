import React, { useCallback, useState } from 'react';
import Configurator from './components/Configurator';
import PageContainer from './components/PageContainer';
import DebugPanel from './components/DebugPanel';
import { SourceSelector } from './components/SourceSelector';
import { useAppState } from './utils/useAppState';
import './App.css';

function App() {
  const { 
    cardMode,
    updateCardMode,
    creatureSelection,
    updateCreatureSelection,
    spellSelection, 
    updateSpellSelection, 
    layoutConfig, 
    updateLayoutConfig,
    debug,
    sourceSelection,
    updateSourceSelection
  } = useAppState();

  // Runtime-only selected cards (not persisted)
  const [selectedCards, setSelectedCards] = useState([]);

  const handleSelectionChange = useCallback((selection) => {
    // Only keep final computed list in runtime state
    setSelectedCards(selection.cards || []);
  }, []);

  const handleSourcesChange = useCallback((sources) => {
    updateSourceSelection({ enabledSources: sources });
  }, [updateSourceSelection]);

  const handleLayoutChange = useCallback((layout) => {
    updateLayoutConfig(layout);
    console.log('Layout config updated:', layout);
  }, [updateLayoutConfig]);

  const handleCardModeChange = useCallback((newMode) => {
    updateCardMode(newMode);
  }, [updateCardMode]);

  return (
    <div className={`app ${debug?.showOutlines ? 'debug-outlines-enabled' : ''}`}>
      <header className="app-header">
        <h1>D&D Spell & Creature Card Creator</h1>
        <p>Create custom spell cards and creature reference cards for your D&D adventures</p>
      </header>
      
      <Configurator 
        cardMode={cardMode}
        onCardModeChange={handleCardModeChange}
        onSelectionChange={handleSelectionChange}
        onLayoutChange={handleLayoutChange}
        enabledSources={sourceSelection.enabledSources}
        onSourcesChange={handleSourcesChange}
        selectedSources={sourceSelection.enabledSources}
        hasUserChoice={sourceSelection.hasUserChoice}
        creatureSelection={creatureSelection}
        updateCreatureSelection={updateCreatureSelection}
      />
      <PageContainer 
        cards={selectedCards}
        layoutConfig={layoutConfig}
      />
      
      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}

export default App
