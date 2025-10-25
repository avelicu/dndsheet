import React, { useMemo, useState } from 'react';
import './AdditionalSpells.css';
import './SelectorCommon.css';

/**
 * AdditionalSpells selector
 * Props:
 * - allSpells: Array<Spell>
 * - activeSpellNames: Set<string> (spells already included by class/level filters)
 * - selectedNames: Array<string>
 * - onChange: (names: string[]) => void
 */
const AdditionalSpells = ({ allSpells = [], activeSpellNames = new Set(), selectedNames = [], onChange }) => {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const items = useMemo(() => {
    const list = allSpells.map(s => ({ name: s.name }));
    if (!normalizedQuery) return list;
    return list.filter(i => i.name.toLowerCase().includes(normalizedQuery));
  }, [allSpells, normalizedQuery]);

  const selectedSet = useMemo(() => new Set(selectedNames), [selectedNames]);

  const toggle = (name, disabled) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(name)) next.delete(name); else next.add(name);
    onChange?.(Array.from(next));
  };

  return (
    <div className="additional-spells selector-panel">
      <h3 className="selector-group-header">Additional Spells</h3>
      <div className="selector-search">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search spells..."
          className="selector-search-input"
        />
      </div>
      <ul className="selector-checkbox-list">
        {items.map(({ name }) => {
          const isActive = activeSpellNames.has(name);
          const isSelected = selectedSet.has(name);
          const disabled = isActive; // grey out and prevent changes if already included
          return (
            <li key={name}>
              <label className={`selector-checkbox-label ${disabled ? 'disabled' : ''}`} title={name}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(name, disabled)}
                  disabled={disabled}
                />
                <span className="selector-checkbox-text">{name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdditionalSpells;
