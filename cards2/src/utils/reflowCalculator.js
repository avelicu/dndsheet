import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
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

const MIN_SCALE = 0.8; // use minimal scale for all continuation cards
const SCALE_STEP = 0.1;

const performCalculation = async (spells, cardSize) => {
  if (!spells || spells.length === 0) {
    return [];
  }

  const cardDataArray = SpellToCardDataTransformer.transformArray(spells);

  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'absolute';
  hiddenContainer.style.top = '-9999px';
  hiddenContainer.style.left = '-9999px';
  hiddenContainer.style.visibility = 'hidden';
  hiddenContainer.style.width = 'auto';
  hiddenContainer.style.height = 'auto';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  const root = createRoot(hiddenContainer);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const cardDimensions = getCardDimensions(cardSize);
    const constrainedHeightInches = parseFloat(cardDimensions.height);
    const constrainedPx = constrainedHeightInches * 96;

    const reflowed = [];

    // Helper to measure overflow for a given CardData
    const measureOverflow = (cardData) => {
      flushSync(() => {
        root.render(React.createElement('div', null, React.createElement(Card, {
          key: `measure-${cardData.title}-${cardData.fontScale}`,
          cardData,
          cardSize,
          unconstrained: true
        })));
      });
      const el = hiddenContainer.querySelector('.spell-card');
      if (!el) {
        throw new Error('Card element not found when measuring');
      }
      const heightPx = el.offsetHeight;
      return Math.max(0, heightPx - constrainedPx);
    };

    // Helper: split a long description into multiple CardData entries using binary search on words
    const splitIntoContinuations = (original, minScale) => {
      const results = [];
      // Extract plain text from HTML body
      const scratch = document.createElement('div');
      scratch.innerHTML = original.body || '';
      const fullText = scratch.textContent || scratch.innerText || '';
      const words = fullText.split(/\s+/).filter(Boolean);
      let start = 0;

      // Guard: if no words, just return original marked overflow
      if (words.length === 0) {
        const only = { ...original, fontScale: minScale, isOverflowing: true, overflowPx: 1, error: true, sizeReduced: minScale < 1 };
        results.push(only);
        return results;
      }

      while (start < words.length) {
        let lo = 1;
        let hi = words.length - start;
        let best = 0;

        // Binary search the max words that fit
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          const bodyText = words.slice(start, start + mid).join(' ');
          const testData = { ...original, body: bodyText, fontScale: minScale };
          const overflow = measureOverflow(testData);
          if (overflow <= 0) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        // Ensure progress even if nothing fits (very long single word)
        if (best === 0) {
          best = 1;
        }

        const bodyText = words.slice(start, start + best).join(' ');
        const partData = { ...original, body: bodyText, fontScale: minScale };
        const overflowPart = measureOverflow(partData);
        partData.isOverflowing = true;
        partData.overflowPx = overflowPart;
        partData.error = false; // this part fits or progressed; not an error card
        partData.sizeReduced = minScale < 1.0;
        results.push(partData);

        start += best;
      }

      return results;
    };

    for (let i = 0; i < cardDataArray.length; i++) {
      const original = cardDataArray[i];
      let chosenScale = 1.0;
      let overflowPx = 0;
      let fits = false;

      for (let scale = 1.0; scale >= MIN_SCALE; scale -= SCALE_STEP) {
        const testData = { ...original, fontScale: parseFloat(scale.toFixed(1)) };
        overflowPx = measureOverflow(testData);
        if (overflowPx <= 0) {
          chosenScale = parseFloat(scale.toFixed(1));
          fits = true;
          break;
        }
      }

      if (!fits) {
        // Use minimal scale and split into continuations recursively until all text fits
        const parts = splitIntoContinuations(original, MIN_SCALE);
        reflowed.push(...parts);
        continue;
      }

      const finalData = { ...original, fontScale: chosenScale };
      finalData.isOverflowing = false;
      finalData.overflowPx = 0;
      finalData.error = false;
      finalData.sizeReduced = chosenScale < 1.0;
      reflowed.push(finalData);
    }

    return reflowed;
  } finally {
    // IMPORTANT: Do not swallow errors in this function.
    // If something goes wrong we want the app to crash for debuggability.
    try { root.unmount(); } catch {}
    try { document.body.removeChild(hiddenContainer); } catch {}
  }
};
