import React from 'react';
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
    updateLayoutConfig 
  } = useAppState();

  const handleSelectionChange = (selection) => {
    updateSpellSelection(selection);
    console.log('Spell selection updated:', selection);
  };

  const handleLayoutChange = (layout) => {
    updateLayoutConfig(layout);
    console.log('Layout config updated:', layout);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>D&D Spell Card Creator</h1>
        <p>Create custom spell cards for your D&D adventures</p>
      </header>
      
      <Configurator 
        onSelectionChange={handleSelectionChange}
        onLayoutChange={handleLayoutChange}
      />
      <PageContainer 
        spellSelection={spellSelection}
        layoutConfig={layoutConfig}
      />
      
      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}

export default App
