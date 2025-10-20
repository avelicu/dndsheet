import React from 'react';
import { getCardDimensions } from '../utils/layoutConfig';
import './Card.css';

const Card = ({ spell, cardSize = 'standard', unconstrained = false, className = '' }) => {
  const dimensions = getCardDimensions(cardSize);

  const levelText = spell.level.toString();

  // Shared utility for spell name processing and ritual detection
  const processSpellName = (name) => {
    if (!name) return { formatted: '', isRitual: false };
    
    const isRitual = name.toLowerCase().includes('(ritual)');
    let formatted = name;
    
    if (isRitual) {
      formatted = formatted.replace(/\s*\(ritual\)/gi, '');
    }
    
    return { formatted, isRitual };
  };

  // Shared utility for duration formatting and concentration detection
  const processDuration = (duration) => {
    if (!duration) return { formatted: '', isConcentration: false };
    
    const isConcentration = duration.toLowerCase().includes('concentration');
    let formatted = duration;
    
    if (isConcentration) {
      formatted = formatted.replace(/^Concentration,\s*/i, '');
    }
    // Replace "up to" with less-than-or-equal-to symbol
    formatted = formatted.replace(/up to/gi, '≤');
    
    return { formatted, isConcentration };
  };

  const { formatted: formattedDuration, isConcentration } = processDuration(spell.duration);
  const { formatted: formattedName, isRitual } = processSpellName(spell.name);

  return (
    <div 
      className={`spell-card ${className}`}
      style={{
        width: dimensions.width,
        height: unconstrained ? 'auto' : dimensions.height
      }}
    >
      {/* Spell Name Header */}
      <div className="spell-name">
        {isRitual && (
          <div className="ritual-indicator">
            <span>R</span>
          </div>
        )}
        <span className="spell-title-text">{formattedName}</span>
        <div className="spell-level-circle">
          <span>{levelText}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="spell-content">
        {/* Header Bar with Details */}
        <div className="spell-header-bar">
          <div className="spell-header-column">
            <div className="spell-header-label">RANGE</div>
            <div className="spell-header-value">{spell.range}</div>
          </div>
          <div className="spell-header-column">
            <div className="spell-header-label">COMPONENTS</div>
            <div className="spell-header-value">{spell.components}</div>
          </div>
          <div className="spell-header-column">
            <div className="spell-header-label">DURATION</div>
            <div className="spell-header-value">
              {isConcentration && (
                <span className="concentration-indicator-inline">C</span>
              )}
              {formattedDuration}
            </div>
          </div>
          <div className="spell-header-column">
            <div className="spell-header-label">CASTING TIME</div>
            <div className="spell-header-value">{spell.castingTime}</div>
          </div>
        </div>

        {/* Description Body */}
        <div className="spell-body">
          <div className="spell-description">
            <div className="spell-description-content">
              {spell.materialComponent && (
                <>
                  <em>Material Component:</em> {spell.materialComponent}<br/><br/>
                </>
              )}
              <span 
                className="description-content"
                dangerouslySetInnerHTML={{ __html: spell.description }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="spell-footer">
        <div className="spell-school">{spell.schoolOfMagic}</div>
        <div className="spell-classes">{spell.classes.join(', ')}</div>
      </div>
    </div>
  );
};

export default Card;
