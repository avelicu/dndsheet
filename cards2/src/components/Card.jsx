import React from 'react';
import { getCardDimensions } from '../utils/layoutConfig';
import './Card.css';

const Card = ({ cardData, cardSize = 'standard', unconstrained = false, className = '' }) => {
  const dimensions = getCardDimensions(cardSize);

  // Use cardData properties directly
  const title = cardData.title;
  const leftIndicator = cardData.leftIndicator; // 'R' for ritual
  const rightIndicator = cardData.rightIndicator; // spell level
  // Support both old format (array of specs) and new format (array of arrays of specs)
  const specsRaw = cardData.specs || [];
  const specsRows = Array.isArray(specsRaw) && specsRaw.length > 0 && Array.isArray(specsRaw[0]) 
    ? specsRaw // New format: array of arrays
    : [specsRaw]; // Old format: single array, wrap it in another array
  const body = cardData.body;
  const bottomLeft = cardData.bottomLeft; // school of magic
  const bottomRight = cardData.bottomRight; // classes
  const fontScale = typeof cardData.fontScale === 'number' ? cardData.fontScale : 1;
  const letterSpacing = typeof cardData.letterSpacing === 'number' ? cardData.letterSpacing : 0;

  const showErrorOutline = !!(cardData.error || cardData.isOverflowing);
  const showSizeReducedOutline = !!cardData.sizeReduced;

  const sizeClass = `card--${cardSize}`; // expected: card--mini|standard|large

  return (
    <div 
      className={`spell-card ${sizeClass} ${className} ${showErrorOutline ? 'card-error' : ''} ${showSizeReducedOutline ? 'card-size-reduced' : ''}`}
      style={{
        width: dimensions.width,
        height: unconstrained ? 'auto' : dimensions.height
      }}
    >
      {/* Spell Name Header */}
      <div className="spell-name">
        {leftIndicator && (
          <div className="ritual-indicator">
            <span>{leftIndicator}</span>
          </div>
        )}
        <span className="spell-title-text">{title}</span>
        <div className="spell-level-circle">
          <span>{rightIndicator}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="spell-content">
        {/* Header Bar with Details - multiple rows */}
        {specsRows.length > 0 && specsRows[0].length > 0 && (
          <div className="spell-header-container">
            {specsRows.map((specs, rowIndex) => (
              <div key={rowIndex} className="spell-header-bar">
                {specs.map((spec, specIndex) => (
                  <div key={specIndex} className="spell-header-column">
                    <div className="spell-header-label">{spec.label}</div>
                    <div className="spell-header-value">
                      {spec.hasConcentration && (
                        <span className="concentration-indicator-inline">C</span>
                      )}
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Description Body */}
        <div className="spell-body">
          <div className="spell-description">
            <div className="spell-description-content" style={{ 
              fontSize: `${fontScale * 100}%`,
              letterSpacing: `${letterSpacing}em`
            }}>
              <span 
                className="description-content"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="spell-footer">
        <div className="spell-school">{bottomLeft}</div>
        <div className="spell-classes">{bottomRight}</div>
      </div>
    </div>
  );
};

export default Card;
