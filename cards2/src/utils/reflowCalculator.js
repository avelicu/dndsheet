import React from 'react';
import { createRoot } from 'react-dom/client';
import Card from '../components/Card';
import { getCardDimensions } from './layoutConfig';

// Debounce mechanism to prevent rapid successive calls
let calculationTimeout = null;

/**
 * Utility to calculate which spells overflow their containers
 * @param {Array<Spell>} spells - Array of spells to measure
 * @param {string} cardSize - Card size to use for measurement
 * @returns {Promise<Array<Object>>} Array of spells with overflow information
 */
export const reflowCalculator = async (spells, cardSize = 'standard') => {
  // Clear any pending calculation
  if (calculationTimeout) {
    clearTimeout(calculationTimeout);
  }

  // Return a promise that resolves after debounced calculation
  return new Promise((resolve) => {
    calculationTimeout = setTimeout(async () => {
      const result = await performCalculation(spells, cardSize);
      resolve(result);
    }, 100);
  });
};

const performCalculation = async (spells, cardSize) => {
  // Early return if no spells
  if (!spells || spells.length === 0) {
    return spells.map(spell => ({ ...spell, isOverflowing: false, overflowPx: 0 }));
  }

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
      // Render all spells with unconstrained height
      const cards = spells.map((spell, index) => 
        React.createElement(Card, {
          key: `measure-${spell.name}-${index}`,
          spell: spell,
          cardSize: cardSize,
          unconstrained: true
        })
      );

      // Render to hidden container
      root.render(React.createElement('div', null, cards));

      // Wait for render to complete, then measure
      setTimeout(() => {
        const cardElements = hiddenContainer.querySelectorAll('.spell-card');
        const cardDimensions = getCardDimensions(cardSize);
        const constrainedHeightInches = parseFloat(cardDimensions.height);
        const constrainedPx = constrainedHeightInches * 96; // convert inches to pixels
        
        const reflowedSpells = spells.map((spell, index) => {
          const cardElement = cardElements[index];
          if (!cardElement) {
            return { ...spell, isOverflowing: false, overflowPx: 0 };
          }

          // Get unconstrained height (actual rendered height)
          const unconstrainedPx = cardElement.offsetHeight;
          const overflowPx = Math.max(0, unconstrainedPx - constrainedPx);
          const isOverflowing = overflowPx > 0;
          
          // Log overflow if detected
          if (isOverflowing) {
            console.log(`Overflow: ${spell.name} (${overflowPx}px overflow)`);
          }

          return {
            ...spell,
            isOverflowing,
            overflowPx
          };
        });

        // Cleanup
        root.unmount();
        document.body.removeChild(hiddenContainer);
        
        resolve(reflowedSpells);
      }, 100);

    } catch (error) {
      console.error('Error in reflowCalculator:', error);
      // Cleanup on error
      try {
        root.unmount();
        document.body.removeChild(hiddenContainer);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      // Return original spells with no overflow info on error
      resolve(spells.map(spell => ({ ...spell, isOverflowing: false, overflowPx: 0 })));
    }
  });
};
