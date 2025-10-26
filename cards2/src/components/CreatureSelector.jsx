import React, { useState } from 'react';
import './SelectorCommon.css';
import './CreatureSelector.css';

const SUMMONING_SPELLS = {
  'Conjure Animals': {
    creatureType: 'beast',
    options: [
      { count: 8, maxCR: '¼', crValue: 0.25 },
      { count: 4, maxCR: '½', crValue: 0.5 },
      { count: 2, maxCR: '1', crValue: 1 },
      { count: 1, maxCR: '2', crValue: 2 }
    ]
  },
  'Conjure Celestial': {
    creatureType: 'celestial',
    options: [
      { count: 1, maxCR: '4', crValue: 4 },
      { count: 1, maxCR: '5', crValue: 5, note: '9th level slot' }
    ]
  },
  'Conjure Elemental': {
    creatureType: 'elemental',
    options: [
      { count: 1, maxCR: '5', crValue: 5 }
    ]
  },
  'Conjure Fey': {
    creatureType: 'fey',
    options: [
      { count: 1, maxCR: '6', crValue: 6 }
    ]
  },
  'Conjure Minor Elementals': {
    creatureType: 'elemental',
    options: [
      { count: 8, maxCR: '¼', crValue: 0.25 },
      { count: 4, maxCR: '½', crValue: 0.5 },
      { count: 2, maxCR: '1', crValue: 1 },
      { count: 1, maxCR: '2', crValue: 2 }
    ]
  },
  'Conjure Woodland Beings': {
    creatureType: 'fey',
    options: [
      { count: 8, maxCR: '¼', crValue: 0.25 },
      { count: 4, maxCR: '½', crValue: 0.5 },
      { count: 2, maxCR: '1', crValue: 1 },
      { count: 1, maxCR: '2', crValue: 2 }
    ]
  },
  'Summon Greater Demon': {
    creatureType: 'fiend',
    options: [
      { count: 1, maxCR: '5', crValue: 5 }
    ]
  },
  'Summon Lesser Demons': {
    creatureType: 'fiend',
    options: [
      { count: 2, maxCR: '1', crValue: 1 },
      { count: 4, maxCR: '½', crValue: 0.5 },
      { count: 8, maxCR: '¼', crValue: 0.25 }
    ]
  }
};

const CreatureSelector = ({ types = [], challengeRatings = [], selectedTypes = [], selectedCR = '', onTypesChange, onCRChange }) => {
  const parseCR = (cr) => {
    if (typeof cr === 'string' && cr.includes('/')) {
      const [num, den] = cr.split('/').map(Number);
      return num / den;
    }
    return Number(cr);
  };
  
  // Initialize from selectedCR or use defaults
  const maxAvailableCR = challengeRatings.length > 0 ? challengeRatings[challengeRatings.length - 1] : '∞';
  
  const [crMin, setCrMin] = useState(() => {
    if (selectedCR && selectedCR.includes('-')) {
      return selectedCR.split('-')[0];
    }
    return '0';
  });
  
  const [crMax, setCrMax] = useState(() => {
    if (selectedCR && selectedCR.includes('-')) {
      return selectedCR.split('-')[1];
    }
    return maxAvailableCR;
  });
  
  const [selectedSpell, setSelectedSpell] = useState('');
  const [spellOption, setSpellOption] = useState('');
  
  const handleTypeToggle = (type) => {
    const newSelected = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newSelected);
    // Clear spell selection when manually adjusting
    if (selectedSpell) {
      setSelectedSpell('');
      setSpellOption('');
    }
  };
  
  const handleCRMinChange = (event) => {
    const newMin = event.target.value;
    setCrMin(newMin);
    const maxVal = crMax === '∞' ? '∞' : crMax;
    onCRChange(newMin && maxVal ? `${newMin}-${maxVal}` : '');
    // Clear spell selection when manually adjusting
    if (selectedSpell) {
      setSelectedSpell('');
      setSpellOption('');
    }
  };
  
  const handleCRMaxChange = (event) => {
    const newMax = event.target.value;
    setCrMax(newMax);
    const maxVal = newMax === '∞' ? '∞' : newMax;
    onCRChange(crMin && maxVal ? `${crMin}-${maxVal}` : '');
    // Clear spell selection when manually adjusting
    if (selectedSpell) {
      setSelectedSpell('');
      setSpellOption('');
    }
  };
  
  const handleSpellChange = (event) => {
    const spellName = event.target.value;
    setSelectedSpell(spellName);
    
    if (!spellName) {
      setSpellOption('');
      return;
    }
    
    const spell = SUMMONING_SPELLS[spellName];
    if (spell) {
      // Set the creature type filter
      const typeList = spell.creatureType === 'beast' ? ['beast'] : [spell.creatureType];
      onTypesChange(typeList);
      
      // Auto-select the option with the highest max CR (most freeform)
      const highestOption = spell.options.reduce((max, opt) => 
        opt.crValue > max.crValue ? opt : max
      );
      const highestOptionIndex = spell.options.indexOf(highestOption);
      setSpellOption(String(highestOptionIndex));
      
      // Apply the filter immediately
      const maxCR = highestOption.crValue;
      setCrMin('0');
      setCrMax(crValueToFormatted(maxCR));
      onCRChange(`0-${crValueToFormatted(maxCR)}`);
    }
  };
  
  const handleSpellOptionChange = (event) => {
    const optionIndex = parseInt(event.target.value);
    setSpellOption(event.target.value);
    
    if (selectedSpell && SUMMONING_SPELLS[selectedSpell]) {
      const spell = SUMMONING_SPELLS[selectedSpell];
      const option = spell.options[optionIndex];
      
      if (option) {
        // Set CR max filter (0 as min since these are "CR X or lower")
        const maxCR = option.crValue;
        setCrMin('0');
        setCrMax(crValueToFormatted(maxCR));
        onCRChange(`0-${crValueToFormatted(maxCR)}`);
      }
    }
  };
  
  const crValueToFormatted = (cr) => {
    if (cr === 0.125) return '⅛';
    if (cr === 0.25) return '¼';
    if (cr === 0.5) return '½';
    return cr.toString();
  };
  
  const formattedToCrValue = (str) => {
    if (str === '⅛') return 0.125;
    if (str === '¼') return 0.25;
    if (str === '½') return 0.5;
    return parseFloat(str);
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
        <h3 className="selector-group-header">Summoning Spell</h3>
        <div className="cr-range-container">
          <div className="selector-dropdown-container">
            <select className="selector-dropdown" value={selectedSpell} onChange={handleSpellChange}>
              <option value="">None</option>
              {Object.keys(SUMMONING_SPELLS).map(spellName => (
                <option key={spellName} value={spellName}>{spellName}</option>
              ))}
            </select>
          </div>
          {selectedSpell && SUMMONING_SPELLS[selectedSpell].options.length > 1 && (
            <div className="selector-dropdown-container">
              <select className="selector-dropdown" value={spellOption} onChange={handleSpellOptionChange}>
                {SUMMONING_SPELLS[selectedSpell].options.map((opt, idx) => (
                  <option key={idx} value={idx}>{opt.count} creature{opt.count > 1 ? 's' : ''} of CR ≤ {opt.maxCR}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <h3 className="selector-group-header" style={{ marginTop: '16px' }}>Challenge Rating</h3>
        <div className="cr-range-container">
          <div className="selector-dropdown-container">
            <select className="selector-dropdown" value={crMin} onChange={handleCRMinChange}>
              <option value="0">0</option>
              {challengeRatings.map(cr => (
                <option key={cr} value={cr}>{cr}</option>
              ))}
            </select>
          </div>
          <div className="selector-dropdown-container">
            <select className="selector-dropdown" value={crMax} onChange={handleCRMaxChange}>
              {challengeRatings.map(cr => (
                <option key={cr} value={cr}>{cr}</option>
              ))}
              <option value="∞">∞</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatureSelector;

