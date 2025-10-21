import React, { useCallback, useState } from 'react';
import Configurator from './components/Configurator';
import PageContainer from './components/PageContainer';
import DebugPanel from './components/DebugPanel';
import { useAppState } from './utils/useAppState';
import './App.css';

function App() {
  const { 
    spellSelection, 
    updateSpellSelection, 
    layoutConfig, 
    updateLayoutConfig,
    debug
  } = useAppState();

  // Runtime-only selected spells (not persisted)
  const [selectedSpells, setSelectedSpells] = useState([]);

  const handleSelectionChange = useCallback((selection) => {
    // Only keep final computed list in runtime state
    setSelectedSpells(selection.spells || []);
  }, []);

  const handleLayoutChange = useCallback((layout) => {
    updateLayoutConfig(layout);
    console.log('Layout config updated:', layout);
  }, [updateLayoutConfig]);

  return (
    <div className={`app ${debug?.showOutlines ? 'debug-outlines-enabled' : ''}`}>
      <header className="app-header">
        <h1>D&D Spell Card Creator</h1>
        <p>Create custom spell cards for your D&D adventures</p>
      </header>
      
      <Configurator 
        onSelectionChange={handleSelectionChange}
        onLayoutChange={handleLayoutChange}
      />
      <PageContainer 
        spells={selectedSpells}
        layoutConfig={layoutConfig}
      />
      
      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}

export default App
