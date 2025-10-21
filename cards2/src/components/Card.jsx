import React from 'react';
import { getCardDimensions } from '../utils/layoutConfig';
import './Card.css';

const Card = ({ cardData, cardSize = 'standard', unconstrained = false, className = '' }) => {
  const dimensions = getCardDimensions(cardSize);

  // Use cardData properties directly
  const title = cardData.title;
  const leftIndicator = cardData.leftIndicator; // 'R' for ritual
  const rightIndicator = cardData.rightIndicator; // spell level
  const specs = cardData.specs || [];
  const body = cardData.body;
  const bottomLeft = cardData.bottomLeft; // school of magic
  const bottomRight = cardData.bottomRight; // classes
  const fontScale = typeof cardData.fontScale === 'number' ? cardData.fontScale : 1;

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
        {/* Header Bar with Details */}
        {specs.length > 0 && (
          <div className="spell-header-bar">
            {specs.map((spec, index) => (
              <div key={index} className="spell-header-column">
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
        )}

        {/* Description Body */}
        <div className="spell-body">
          <div className="spell-description">
            <div className="spell-description-content" style={{ fontSize: `${fontScale * 100}%` }}>
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
