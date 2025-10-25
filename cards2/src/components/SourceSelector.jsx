import React, { useState, useEffect } from 'react';
import { loadSpellSources } from '../utils/spellDataParser.js';
import './SourceSelector.css';
import './SelectorCommon.css';

export function SourceSelector({ onSourcesChange, selectedSources = [], hasUserChoice = false }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  // Sync with parent state when selectedSources prop changes
  useEffect(() => {
    if (sources.length > 0 && selectedSources.length === 0 && !hasUserChoice) {
      // Only initialize with defaults if user hasn't made an explicit choice yet
      const defaultSources = sources
        .filter(source => source.default)
        .map(source => source.id);
      onSourcesChange(defaultSources);
    }
  }, [sources, selectedSources, hasUserChoice, onSourcesChange]);

  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const sourcesConfig = await loadSpellSources();
      setSources(sourcesConfig.sources);
    } catch (err) {
      console.error('Failed to load spell sources:', err);
      setError('Failed to load spell sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (sourceId) => {
    const newSelectedSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(id => id !== sourceId)
      : [...selectedSources, sourceId];
    
    onSourcesChange(newSelectedSources);
  };

  if (loading) {
    return (
      <div className="source-selector">
        <h3 className="selector-group-header">Spell Sources</h3>
        <div className="loading">Loading sources...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="source-selector">
        <h3 className="selector-group-header">Spell Sources</h3>
        <div className="error">{error}</div>
        <button onClick={loadSources} className="source-control-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="source-selector">
      <h3 className="selector-group-header">Spell Sources</h3>
      <div className="selector-selection-count">
        {selectedSources.length} of {sources.length} selected
      </div>

      <ul className="selector-checkbox-list">
        {sources.map(source => (
          <li key={source.id}>
            <label className="selector-checkbox-label">
              <input
                type="checkbox"
                checked={selectedSources.includes(source.id)}
                onChange={() => handleSourceToggle(source.id)}
              />
              <div className="source-info-inline">
                <span className="selector-checkbox-text">{source.name}</span>
                <span className="source-description-small">{source.description}</span>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
