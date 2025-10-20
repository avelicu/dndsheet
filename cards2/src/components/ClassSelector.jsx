import React from 'react';
import './ClassSelector.css';
import './SelectorCommon.css';

const ClassSelector = ({ classes, selectedClasses, onClassChange }) => {
  const handleClassChange = (className, isChecked) => {
    if (isChecked) {
      onClassChange([...selectedClasses, className]);
    } else {
      onClassChange(selectedClasses.filter(cls => cls !== className));
    }
  };

  return (
    <div className="class-selector">
      <h3 className="selector-group-header">Classes</h3>
      <div className="selector-selection-count">
        {selectedClasses.length} selected
      </div>
      <ul className="selector-checkbox-list">
        {classes.map(className => (
          <li key={className}>
            <label className="selector-checkbox-label">
              <input
                type="checkbox"
                checked={selectedClasses.includes(className)}
                onChange={(e) => handleClassChange(className, e.target.checked)}
              />
              <span className="selector-checkbox-text">{className}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassSelector;
