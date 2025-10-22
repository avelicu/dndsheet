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
      // Normalize leading breaks/whitespace before slicing
      const normalizeLeading = (fragmentHtml) => {
        const d = document.createElement('div');
        d.innerHTML = fragmentHtml || '';
        while (d.firstChild) {
          const n = d.firstChild;
          if (n.nodeType === Node.TEXT_NODE && !/\S/.test(n.nodeValue || '')) { d.removeChild(n); continue; }
          if (n.nodeType === Node.ELEMENT_NODE && n.nodeName === 'BR') { d.removeChild(n); continue; }
          break;
        }
        return d.innerHTML;
      };

      const container = document.createElement('div');
      container.innerHTML = normalizeLeading(html || '');

      if (wordLimit <= 0) {
        return { firstHTML: '', restHTML: normalizeLeading(html || '') };
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
        const normalized = normalizeLeading(html || '');
        return { firstHTML: normalized, restHTML: '' };
      }

      const r1 = document.createRange();
      r1.setStart(container, 0);
      r1.setEnd(targetNode, targetOffset);
      const frag1 = r1.cloneContents();
      const wrap1 = document.createElement('div');
      wrap1.appendChild(frag1);
      const rawFirst = wrap1.innerHTML;

      const r2 = document.createRange();
      r2.setStart(targetNode, targetOffset);
      r2.setEnd(container, container.childNodes.length);
      const frag2 = r2.cloneContents();
      const wrap2 = document.createElement('div');
      wrap2.appendChild(frag2);
      const rawRest = wrap2.innerHTML;

      // Trim leading breaks/whitespace on both outputs
      const firstHTML = normalizeLeading(rawFirst);
      const restHTML = normalizeLeading(rawRest);

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
      let best = 0;

      let probeData;
      let rest;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const sliceRes = sliceHTMLByWords(html, mid);
        probeData = { ...baseData, body: sliceRes.firstHTML };
        rest = sliceRes.restHTML;

        const overflow = measureOverflow(probeData);
        console.debug('[reflow] probe', { words: mid, tail: textPreview(sliceRes.firstHTML), overflow });
        if (overflow <= 0) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (best === 0) {
        best = 1; // ensure progress
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

      for (let scale = 1.0; scale >= MIN_SCALE; scale -= SCALE_STEP) {
        probeData = { ...original, fontScale: scale, sizeReduced: scale < 1.0 };
        overflowPx = measureOverflow(probeData);
        if (overflowPx <= 0) {
          fits = true;
          break;
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
