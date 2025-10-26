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

const MIN_SCALE = 0.7; // use minimal scale for all continuation cards
const SCALE_STEP = 0.01;
const LETTER_SPACING_STEP = -0.005; // em units
const MIN_LETTER_SPACING = -0.02; // em units

// Shared helper: normalize leading <br> and whitespace-only text nodes
const normalizeLeading = (fragmentHtml) => {
  const d = document.createElement('div');
  d.innerHTML = fragmentHtml || '';
  while (d.firstChild) {
    const n = d.firstChild;
    if (n.nodeType === Node.TEXT_NODE && !/\S/.test(n.nodeValue || '')) { d.removeChild(n); continue; }
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName === 'BR') { d.removeChild(n); continue; }
    break;
  }
  return d;
};

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
        // include body length and letterSpacing in key to avoid DOM reuse
        const letterSpacing = cardData.letterSpacing || 0;
        root.render(React.createElement('div', null, React.createElement(Card, {
          key: `measure-${cardData.title}-${cardData.fontScale}-${letterSpacing}-${(cardData.body||'').length}`,
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

    // Count words in HTML using the same DOM walk as slicing
    const countWordsInHTML = (html) => {
      const container = normalizeLeading(html || '');
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => (node.nodeValue && /\S/.test(node.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        }
      );
      let words = 0;
      while (walker.nextNode()) {
        const str = walker.currentNode.nodeValue || '';
        const regex = /\S+/g;
        let m;
        while ((m = regex.exec(str)) !== null) {
          words += 1;
        }
      }
      return words;
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
      const container = normalizeLeading(html || '');

      if (wordLimit <= 0) {
        return { firstHTML: '', restHTML: container.innerHTML };
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
        const str = t.nodeValue || '';
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
        return { firstHTML: container.innerHTML, restHTML: '' };
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

    // Recursive splitter: caller passes baseData; this function reads body from baseData and drops specs for continuations
    const splitHTMLRecursive = (baseData) => {
      const parts = [];
      const html = baseData.body || '';
      const totalWords = countWordsInHTML(html);
      if (totalWords === 0) return parts;

      let lo = 1;
      let hi = totalWords;

      let probeData;
      let rest;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const sliceRes = sliceHTMLByWords(html, mid);
        const temp = { ...baseData, body: sliceRes.firstHTML };
        const overflow = measureOverflow(temp);
        console.debug('[reflow] probe', { lo: lo, hi: hi, words: mid, tail: textPreview(sliceRes.firstHTML), overflow });

        if (overflow <= 0) {
          probeData = temp;
          rest = sliceRes.restHTML;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      console.debug('[reflow] choose part');
      parts.push({ ...probeData });

      if ((rest || '').trim().length > 0) {
        const restBase = { ...probeData, specs: [], body: rest, isOverflowing: true };
        const restParts = splitHTMLRecursive(restBase);
        parts.push(...restParts);
      }

      return parts;
    };

    for (let i = 0; i < cardDataArray.length; i++) {
      const original = cardDataArray[i];
      let overflowPx = 0;
      let fits = false;

      // Declare probeData outside, recreate per attempt
      let probeData;

      // First, try reducing letter spacing (0 to -0.02em in steps of -0.005em)
      let letterSpacingAdjusted = false;
      for (let spacing = 0; spacing >= MIN_LETTER_SPACING; spacing += LETTER_SPACING_STEP) {
        probeData = { 
          ...original, 
          fontScale: 1.0, 
          letterSpacing: spacing,
          letterSpacingReduced: spacing < 0
        };
        overflowPx = measureOverflow(probeData);
        if (overflowPx <= 0) {
          fits = true;
          letterSpacingAdjusted = true;
          break;
        }
      }

      // If letter spacing adjustment didn't work, try reducing font scale
      if (!fits) {
        for (let scale = 1.0; scale >= MIN_SCALE; scale -= SCALE_STEP) {
          probeData = { 
            ...original, 
            fontScale: scale, 
            letterSpacing: MIN_LETTER_SPACING, // use minimum letter spacing
            sizeReduced: scale < 1.0,
            letterSpacingReduced: true
          };
          overflowPx = measureOverflow(probeData);
          if (overflowPx <= 0) {
            fits = true;
            break;
          }
        }
      }

      if (!fits) {
        // Couldn't fit by reducing font scale, split it into parts.
        const parts = splitHTMLRecursive(probeData);
        reflowed.push(...parts);
        continue;
      }

      reflowed.push({ ...probeData });
    }

    return reflowed;
  } finally {
    try { root.unmount(); } catch {}
    try { document.body.removeChild(hiddenContainer); } catch {}
  }
};
