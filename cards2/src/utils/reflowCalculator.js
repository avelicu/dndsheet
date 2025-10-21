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

  // IMPORTANT: Do not swallow errors in this function.
  // If something goes wrong we want the app to crash for debuggability.
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
        // include body length in key to avoid DOM reuse
        root.render(React.createElement('div', null, React.createElement(Card, {
          key: `measure-${cardData.title}-${cardData.fontScale}-${(cardData.body||'').length}`,
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

    // Count words in HTML
    const countWordsInHTML = (html) => {
      const c = document.createElement('div');
      c.innerHTML = html || '';
      const text = c.textContent || c.innerText || '';
      const matches = text.trim().match(/\S+/g);
      return matches ? matches.length : 0;
    };

    const textPreview = (html, tailCount = 5) => {
      const c = document.createElement('div');
      c.innerHTML = html || '';
      const text = (c.textContent || c.innerText || '').trim();
      const parts = text.split(/\s+/);
      return parts.slice(Math.max(0, parts.length - tailCount)).join(' ');
    };

    // Slice HTML by word count without breaking tags using DOM Range
    const sliceHTMLByWords = (html, wordLimit) => {
      const container = document.createElement('div');
      container.innerHTML = html || '';

      if (wordLimit <= 0) {
        return { firstHTML: '', restHTML: html || '' };
      }

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => (node.nodeValue && /\S/.test(node.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        }
      );

      let words = 0;
      let targetNode = null;
      let targetOffset = 0;

      while (walker.nextNode()) {
        const t = walker.currentNode;
        const str = t.nodeValue;
        const regex = /\S+/g;
        let m;
        while ((m = regex.exec(str)) !== null) {
          words += 1;
          if (words === wordLimit) {
            targetNode = t;
            targetOffset = m.index + m[0].length; // end of this word
            break;
          }
        }
        if (targetNode) break;
      }

      if (!targetNode) {
        return { firstHTML: html || '', restHTML: '' };
      }

      const r1 = document.createRange();
      r1.setStart(container, 0);
      r1.setEnd(targetNode, targetOffset);
      const frag1 = r1.cloneContents();
      const wrap1 = document.createElement('div');
      wrap1.appendChild(frag1);
      const firstHTML = wrap1.innerHTML;

      const r2 = document.createRange();
      r2.setStart(targetNode, targetOffset);
      r2.setEnd(container, container.childNodes.length);
      const frag2 = r2.cloneContents();
      const wrap2 = document.createElement('div');
      wrap2.appendChild(frag2);
      const restHTML = wrap2.innerHTML;

      return { firstHTML, restHTML };
    };

    // Trim leading <br> and whitespace-only nodes from HTML fragment
    const trimLeadingBreaks = (html) => {
      const c = document.createElement('div');
      c.innerHTML = html || '';
      while (c.firstChild) {
        const n = c.firstChild;
        if (n.nodeType === Node.TEXT_NODE && !/\S/.test(n.nodeValue || '')) { c.removeChild(n); continue; }
        if (n.nodeType === Node.ELEMENT_NODE && n.nodeName === 'BR') { c.removeChild(n); continue; }
        break;
      }
      return c.innerHTML;
    };

    // Helper: split a long HTML description into multiple CardData entries using binary search on words
    const splitIntoContinuations = (original, minScale) => {
      const results = [];
      let remainingHTML = original.body || '';

      const totalWords = () => countWordsInHTML(remainingHTML);

      while ((remainingHTML || '').trim().length > 0) {
        const wordsCount = totalWords();
        if (wordsCount === 0) break;

        let lo = 1;
        let hi = wordsCount;
        let best = 0;

        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          const { firstHTML } = sliceHTMLByWords(remainingHTML, mid);
          const testData = { ...original, body: firstHTML, fontScale: minScale };
          const overflow = measureOverflow(testData);
          const heightPx = constrainedPx + overflow;
          console.debug('[reflow] probe', { words: mid, tail: textPreview(firstHTML), heightPx, overflow });
          if (overflow <= 0) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        if (best === 0) best = 1; // ensure progress

        // Greedily try to pack more words beyond best if they still fit
        let grow = best;
        while (grow < wordsCount) {
          const { firstHTML: growHTML } = sliceHTMLByWords(remainingHTML, grow + 1);
          const testGrow = { ...original, body: growHTML, fontScale: minScale };
          const ovGrow = measureOverflow(testGrow);
          const heightGrow = constrainedPx + ovGrow;
          console.debug('[reflow] grow try', { words: grow + 1, tail: textPreview(growHTML), heightPx: heightGrow, overflow: ovGrow });
          if (ovGrow <= 0) {
            grow += 1;
          } else {
            break;
          }
        }

        const finalCount = grow;
        const { firstHTML, restHTML } = sliceHTMLByWords(remainingHTML, finalCount);
        let cleanFirst = trimLeadingBreaks(firstHTML);
        let cleanRest = trimLeadingBreaks(restHTML);

        // Consolidate short remainders to avoid single-word orphan pages
        const remWords = countWordsInHTML(cleanRest);
        if (remWords > 0 && remWords <= 3) {
          const joiner = cleanFirst && !/\s$/.test(cleanFirst) ? ' ' : '';
          const combined = cleanFirst + joiner + cleanRest;
          const testCombined = { ...original, body: combined, fontScale: minScale };
          const ovCombined = measureOverflow(testCombined);
          const hCombined = constrainedPx + ovCombined;
          console.debug('[reflow] consolidate try', { remWords, tail: textPreview(combined), heightPx: hCombined, overflow: ovCombined });
          if (ovCombined <= 0) {
            cleanFirst = combined;
            cleanRest = '';
          }
        }

        const isFirstPart = results.length === 0;
        const partData = { ...original, body: cleanFirst, fontScale: minScale, specs: isFirstPart ? (original.specs || []) : [] };
        const overflowPart = measureOverflow(partData);
        const heightPxPart = constrainedPx + overflowPart;
        console.debug('[reflow] choose part', { words: finalCount, tail: textPreview(cleanFirst), heightPx: heightPxPart, overflow: overflowPart, remainingWords: countWordsInHTML(cleanRest) });
        partData.isOverflowing = true; // mark continuations as overflown for visibility
        partData.overflowPx = overflowPart;
        partData.error = false;
        partData.sizeReduced = minScale < 1.0;
        results.push(partData);

        remainingHTML = cleanRest;
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
    try { root.unmount(); } catch {}
    try { document.body.removeChild(hiddenContainer); } catch {}
  }
};
