import React, { useState } from 'react';
import ClassLevelSelector from './components/ClassLevelSelector';
import PageContainer from './components/PageContainer';
import './App.css';

function App() {
  const [spellSelection, setSpellSelection] = useState(null);

  const handleSelectionChange = (selection) => {
    setSpellSelection(selection);
    console.log('Spell selection updated:', selection);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>D&D Spell Card Creator</h1>
        <p>Create custom spell cards for your D&D adventures</p>
      </header>
      
      <main className="app-main">
        <ClassLevelSelector onSelectionChange={handleSelectionChange} />
        <PageContainer spellSelection={spellSelection} />
      </main>
    </div>
  );
}

export default App
