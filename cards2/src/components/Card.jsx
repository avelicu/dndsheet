import React from 'react';
import { getCardDimensions } from '../utils/layoutConfig';
import './Card.css';

const Card = ({ spell, cardSize = 'standard', className = '' }) => {
  const dimensions = getCardDimensions(cardSize);

  return (
    <div 
      className={`spell-card ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      <div className="card-header">
        <h3 className="spell-name">{spell.name}</h3>
        <div className="spell-level">{spell.getFormattedLevel()}</div>
      </div>
      
      <div className="card-body">
        <div className="spell-classes">
          {spell.classes.join(', ')}
        </div>
        
        {spell.schoolOfMagic && (
          <div className="spell-school">
            <strong>School:</strong> {spell.schoolOfMagic}
          </div>
        )}
        
        {spell.castingTime && (
          <div className="spell-casting-time">
            <strong>Casting Time:</strong> {spell.castingTime}
          </div>
        )}
        
        {spell.range && (
          <div className="spell-range">
            <strong>Range:</strong> {spell.range}
          </div>
        )}
        
        {spell.components && (
          <div className="spell-components">
            <strong>Components:</strong> {spell.components}
          </div>
        )}
        
        {spell.duration && (
          <div className="spell-duration">
            <strong>Duration:</strong> {spell.duration}
          </div>
        )}
        
        {spell.description && (
          <div className="spell-description">
            {spell.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
