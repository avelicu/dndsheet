import React, { useState, useEffect } from 'react';
import Page from './Page';
import CardGrid from './CardGrid';
import { calculateCardsPerPage } from '../utils/layoutConfig';
import { reflowCalculator } from '../utils/reflowCalculator';
import { SpellToCardDataTransformer } from '../utils/SpellToCardDataTransformer';
import './PageContainer.css';

const PageContainer = ({ cards = [], layoutConfig }) => {
  const [reflowedCardData, setReflowedCardData] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate reflowed cards when input cards or layout config changes
  useEffect(() => {
    const calculateReflow = async () => {
      if (!cards || cards.length === 0) {
        setReflowedCardData([]);
        return;
      }

      setIsCalculating(true);
      
      // Check if cards are already CardData objects (from creature or spell transformer)
      // If they have a 'body' property, they're already transformed CardData
      const areAlreadyCards = cards.length > 0 && cards[0] && typeof cards[0] === 'object' && cards[0].hasOwnProperty('body');
      
      if (areAlreadyCards) {
        // Already transformed, just pass through with reflow calculation
        const reflowed = await reflowCalculator(
          cards, 
          layoutConfig?.cardSize || 'standard'
        );
        setReflowedCardData(reflowed);
      } else {
        // Need transformation (shouldn't happen with new architecture)
        const reflowed = await reflowCalculator(
          cards, 
          layoutConfig?.cardSize || 'standard'
        );
        setReflowedCardData(reflowed);
      }
      
      setIsCalculating(false);
    };

    calculateReflow();
  }, [cards, layoutConfig?.cardSize]);

  if (!cards || cards.length === 0) {
    return (
      <div className="page-container">
        <div className="no-spells-message">
          <p>No cards selected. Choose filters to see cards.</p>
        </div>
      </div>
    );
  }

  // Calculate how many cards fit per page using centralized function
  const cardsPerPage = calculateCardsPerPage(
    layoutConfig?.pageSize || 'letter',
    layoutConfig?.cardSize || 'standard'
  );
  
  // Split reflowed cardData into pages
  const pages = [];
  for (let i = 0; i < reflowedCardData.length; i += cardsPerPage) {
    pages.push(reflowedCardData.slice(i, i + cardsPerPage));
  }

  return (
    <div className="page-container">
      {isCalculating && (
        <div className="calculating-message">
          <p>Calculating card layouts...</p>
        </div>
      )}
      <div className="pages-preview">
        {pages.map((pageCardData, pageIndex) => (
          <Page key={pageIndex} layoutConfig={layoutConfig}>
            <CardGrid 
              cardData={pageCardData}
              cardSize={layoutConfig?.cardSize || 'standard'}
              pageSize={layoutConfig?.pageSize || 'letter'}
            />
          </Page>
        ))}
      </div>
    </div>
  );
};

export default PageContainer;
