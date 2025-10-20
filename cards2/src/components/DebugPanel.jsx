import React, { useState } from 'react';
import stateManager from '../utils/stateManager';
import './DebugPanel.css';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentState, setCurrentState] = useState(stateManager.getState());

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentState(stateManager.getState());
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      stateManager.reset();
      setCurrentState(stateManager.getState());
    }
  };

  const handleExport = () => {
    const stateJson = stateManager.exportState();
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-spell-creator-state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          stateManager.importState(e.target.result);
          setCurrentState(stateManager.getState());
          alert('State imported successfully!');
        } catch (error) {
          alert('Failed to import state: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) {
    return (
      <button className="debug-toggle" onClick={togglePanel}>
        Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Debug Panel</h3>
        <button className="debug-close" onClick={togglePanel}>×</button>
      </div>
      
      <div className="debug-content">
        <div className="debug-section">
          <h4>Current State</h4>
          <pre className="debug-state">
            {JSON.stringify(currentState, null, 2)}
          </pre>
        </div>
        
        <div className="debug-section">
          <h4>Actions</h4>
          <div className="debug-actions">
            <button onClick={handleReset} className="debug-btn debug-btn-danger">
              Reset to Defaults
            </button>
            <button onClick={handleExport} className="debug-btn debug-btn-primary">
              Export State
            </button>
            <label className="debug-btn debug-btn-secondary">
              Import State
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        
        <div className="debug-section">
          <h4>Storage Info</h4>
          <div className="debug-storage">
            <p>Spell Selection: {localStorage.getItem('dnd-spell-creator-spell-selection') ? 'Saved' : 'Not saved'}</p>
            <p>Layout Config: {localStorage.getItem('dnd-spell-creator-layout-config') ? 'Saved' : 'Not saved'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
