import React from 'react';
import Card from './Card';
import { getCardDimensions, calculateGridLayout } from '../utils/layoutConfig';
import './CardGrid.css';

const CardGrid = ({ cardData = [], cardSize = 'standard', pageSize = 'letter' }) => {
  const cardDimensions = getCardDimensions(cardSize);
  const { cardsPerRow, cardsPerColumn } = calculateGridLayout(pageSize, cardSize);

  return (
    <div 
      className="card-grid"
      style={{
        gridTemplateColumns: `repeat(${cardsPerRow}, ${cardDimensions.width})`,
        gridTemplateRows: `repeat(${cardsPerColumn}, ${cardDimensions.height})`
      }}
    >
      {cardData.map((card, cardIndex) => (
        <Card 
          key={`${card.title}-${cardIndex}`}
          cardData={card} 
          cardSize={cardSize}
          className="grid-card"
        />
      ))}
    </div>
  );
};

export default CardGrid;
