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

  try {
    // Ensure fonts are loaded for deterministic measurement
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }

    const cardDimensions = getCardDimensions(cardSize);
    const constrainedHeightInches = parseFloat(cardDimensions.height);
    const constrainedPx = constrainedHeightInches * 96; // convert inches to pixels

    const reflowed = [];

    // Measure one card at a time by re-rendering with updated fontScale
    for (let i = 0; i < cardDataArray.length; i++) {
      const original = cardDataArray[i];
      let chosenScale = 1.0;
      let overflowPx = 0;
      let fits = false;

      for (let scale = 1.0; scale >= 0.5; scale -= 0.1) {
        const testData = { ...original, fontScale: parseFloat(scale.toFixed(1)) };
        // Render test card
        root.render(React.createElement('div', null, React.createElement(Card, {
          key: `measure-${testData.title}-${i}`,
          cardData: testData,
          cardSize: cardSize,
          unconstrained: true
        })));

        // Wait for styles/layout to settle (double rAF)
        await new Promise(resolve => requestAnimationFrame(resolve));

        const cardElement = hiddenContainer.querySelector('.spell-card');
        if (!cardElement) {
          // If not found, assume fits
          chosenScale = parseFloat(scale.toFixed(1));
          fits = true;
          overflowPx = 0;
          break;
        }

        const heightPx = cardElement.offsetHeight;
        overflowPx = Math.max(0, heightPx - constrainedPx);

        if (overflowPx <= 0) {
          chosenScale = parseFloat(scale.toFixed(1));
          fits = true;
          break;
        }
      }

      const finalData = { ...original, fontScale: chosenScale };
      finalData.isOverflowing = !fits && overflowPx > 0;
      finalData.overflowPx = overflowPx;
      finalData.error = finalData.isOverflowing; // mark error when still too big
      finalData.sizeReduced = chosenScale < 1.0;
      if (finalData.isOverflowing) {
        console.log(`Overflow: ${finalData.title} (${overflowPx}px overflow)`);
      }
      reflowed.push(finalData);
    }

    // Cleanup
    root.unmount();
    document.body.removeChild(hiddenContainer);

    return reflowed;
  } catch (error) {
    console.error('Error in reflowCalculator:', error);
    try {
      root.unmount();
      document.body.removeChild(hiddenContainer);
    } catch {}
    // Fallback: return original card data with defaults
    return cardDataArray.map(cardData => ({ ...cardData, isOverflowing: false, overflowPx: 0 }));
  }
};
