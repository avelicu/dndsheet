import React from 'react';
import { getPageSizeOptions, getCardSizeOptions } from '../utils/layoutConfig';
import './LayoutSelector.css';
import './SelectorCommon.css';

const LayoutSelector = ({ pageSize, cardSize, onPageSizeChange, onCardSizeChange }) => {
  const pageSizes = getPageSizeOptions();
  const cardSizes = getCardSizeOptions();

  const handlePageSizeChange = (sizeId) => {
    onPageSizeChange(sizeId);
  };

  const handleCardSizeChange = (sizeId) => {
    onCardSizeChange(sizeId);
  };

  return (
    <div className="layout-selector">
      <h3 className="selector-group-header">Layout</h3>
      
      <div className="layout-options">
        <div className="layout-row">
          <span className="selector-label">Page Size</span>
          <select 
            className="selector-dropdown"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
          >
            {pageSizes.map(size => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="layout-row">
          <span className="selector-label">Card Size</span>
          <select 
            className="selector-dropdown"
            value={cardSize}
            onChange={(e) => handleCardSizeChange(e.target.value)}
          >
            {cardSizes.map(size => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LayoutSelector;
