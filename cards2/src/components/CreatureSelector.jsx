import React, { useState } from 'react';
import './SelectorCommon.css';
import './CreatureSelector.css';

const CreatureSelector = ({ types = [], challengeRatings = [], selectedTypes = [], selectedCR = '', onTypesChange, onCRChange }) => {
  const parseCR = (cr) => {
    if (typeof cr === 'string' && cr.includes('/')) {
      const [num, den] = cr.split('/').map(Number);
      return num / den;
    }
    return Number(cr);
  };
  
  // Initialize from selectedCR or use empty strings
  const [crMin, setCrMin] = useState(() => {
    if (selectedCR && selectedCR.includes('-')) {
      return selectedCR.split('-')[0];
    }
    return '';
  });
  
  const [crMax, setCrMax] = useState(() => {
    if (selectedCR && selectedCR.includes('-')) {
      return selectedCR.split('-')[1];
    }
    return '';
  });
  
  const handleTypeToggle = (type) => {
    const newSelected = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newSelected);
  };
  
  const handleCRMinChange = (event) => {
    const newMin = event.target.value;
    setCrMin(newMin);
    onCRChange(newMin && crMax ? `${newMin}-${crMax}` : '');
  };
  
  const handleCRMaxChange = (event) => {
    const newMax = event.target.value;
    setCrMax(newMax);
    onCRChange(crMin && newMax ? `${crMin}-${newMax}` : '');
  };
  
  return (
    <>
      <div className="creature-selector-creature-type">
        <h3 className="selector-group-header">Creature Type</h3>
        <div className="selector-selection-count">
          {selectedTypes.length} of {types.length} selected
        </div>
        
        <ul className="selector-checkbox-list">
          {types.map(type => (
            <li key={type}>
              <label className="selector-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                />
                <span className="selector-checkbox-text">{type}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="creature-selector-cr">
        <h3 className="selector-group-header">Challenge Rating</h3>
        <div className="cr-range-container">
          <div className="selector-dropdown-container">
            <label className="cr-range-label">Min:</label>
            <select className="selector-dropdown" value={crMin} onChange={handleCRMinChange}>
              <option value="">Any</option>
              {challengeRatings.map(cr => (
                <option key={cr} value={cr}>{cr}</option>
              ))}
            </select>
          </div>
          <div className="selector-dropdown-container">
            <label className="cr-range-label">Max:</label>
            <select className="selector-dropdown" value={crMax} onChange={handleCRMaxChange}>
              <option value="">Any</option>
              {challengeRatings.map(cr => (
                <option key={cr} value={cr}>{cr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatureSelector;

