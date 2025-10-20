import React from 'react';
import { createRoot } from 'react-dom/client';
import Card from '../components/Card';
import { getCardDimensions } from './layoutConfig';
import { SpellToCardDataTransformer } from './SpellToCardDataTransformer';

/**
 * Utility to calculate which spells overflow their containers
 * @param {Array<Spell>} spells - Array of spells to measure
 * @param {string} cardSize - Card size to use for measurement
 * @returns {Promise<Array<CardData>>} Array of card data with overflow information
 */
export const reflowCalculator = async (spells, cardSize = 'standard') => {
  return performCalculation(spells, cardSize);
};

const performCalculation = async (spells, cardSize) => {
  // Early return if no spells
  if (!spells || spells.length === 0) {
    return [];
  }

  // Transform spells to card data
  const cardDataArray = SpellToCardDataTransformer.transformArray(spells);

  // Create a hidden container for measurements
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'absolute';
  hiddenContainer.style.top = '-9999px';
  hiddenContainer.style.left = '-9999px';
  hiddenContainer.style.visibility = 'hidden';
  hiddenContainer.style.width = 'auto';
  hiddenContainer.style.height = 'auto';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  // Create React root for rendering
  const root = createRoot(hiddenContainer);

  return new Promise((resolve) => {
    try {
      // Render all card data with unconstrained height
      const cards = cardDataArray.map((cardData, index) => 
        React.createElement(Card, {
          key: `measure-${cardData.title}-${index}`,
          cardData: cardData,
          cardSize: cardSize,
          unconstrained: true
        })
      );

      // Render to hidden container
      root.render(React.createElement('div', null, cards));

      // Wait for render to complete, then measure
      requestAnimationFrame(() => {
        const cardElements = hiddenContainer.querySelectorAll('.spell-card');
        const cardDimensions = getCardDimensions(cardSize);
        const constrainedHeightInches = parseFloat(cardDimensions.height);
        const constrainedPx = constrainedHeightInches * 96; // convert inches to pixels
        
        const reflowedCardData = cardDataArray.map((cardData, index) => {
          const cardElement = cardElements[index];
          if (!cardElement) {
            cardData.isOverflowing = false;
            cardData.overflowPx = 0;
            return cardData;
          }

          // Get unconstrained height (actual rendered height)
          const unconstrainedPx = cardElement.offsetHeight;
          const overflowPx = Math.max(0, unconstrainedPx - constrainedPx);
          const isOverflowing = overflowPx > 0;
          
          // Log overflow if detected
          if (isOverflowing) {
            console.log(`Overflow: ${cardData.title} (${overflowPx}px overflow)`);
          }

          // Set overflow properties on cardData
          cardData.isOverflowing = isOverflowing;
          cardData.overflowPx = overflowPx;
          return cardData;
        });

        // Cleanup
        root.unmount();
        document.body.removeChild(hiddenContainer);
        
        resolve(reflowedCardData);
      });

    } catch (error) {
      console.error('Error in reflowCalculator:', error);
      // Cleanup on error
      try {
        root.unmount();
        document.body.removeChild(hiddenContainer);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      // Return original card data with no overflow info on error
      resolve(cardDataArray.map(cardData => {
        cardData.isOverflowing = false;
        cardData.overflowPx = 0;
        return cardData;
      }));
    }
  });
};
