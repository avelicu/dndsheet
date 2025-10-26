/**
 * Centralized configuration for page and card dimensions
 * Single source of truth for all sizing information
 */

export const PAGE_SIZES = {
  letter: { 
    id: 'letter', 
    name: 'US Letter', 
    width: '8.5in', 
    height: '11in' 
  },
  a4: { 
    id: 'a4', 
    name: 'A4', 
    width: '210mm', 
    height: '297mm' 
  },
  legal: { 
    id: 'legal', 
    name: 'US Legal', 
    width: '8.5in', 
    height: '14in' 
  },
  tabloid: { 
    id: 'tabloid', 
    name: 'US Tabloid', 
    width: '11in', 
    height: '17in' 
  },
  a3: { 
    id: 'a3', 
    name: 'A3', 
    width: '297mm', 
    height: '420mm' 
  },
  a5: { 
    id: 'a5', 
    name: 'A5', 
    width: '148mm', 
    height: '210mm' 
  }
};

export const CARD_SIZES = {
  mini: { 
    id: 'mini', 
    name: 'Mini Cards (1.75" × 2.5")', 
    width: '1.75in', 
    height: '2.5in' 
  },
  standard: { 
    id: 'standard', 
    name: 'Standard Playing Cards (2.5" × 3.5")', 
    width: '2.5in', 
    height: '3.5in' 
  },
  standardPlus: { 
    id: 'standardPlus', 
    name: 'Standard+ Playing Cards (2.625" × 3.5")', 
    width: '2.625in', 
    height: '3.5in' 
  },
  large: { 
    id: 'large', 
    name: 'Large Cards (3.5" × 5")', 
    width: '3.5in', 
    height: '5in' 
  }
};

/**
 * Get page dimensions by ID
 * @param {string} pageSizeId - Page size identifier
 * @returns {Object} Page dimensions object
 */
export const getPageDimensions = (pageSizeId) => {
  return PAGE_SIZES[pageSizeId] || PAGE_SIZES.letter;
};

/**
 * Get card dimensions by ID
 * @param {string} cardSizeId - Card size identifier
 * @returns {Object} Card dimensions object
 */
export const getCardDimensions = (cardSizeId) => {
  return CARD_SIZES[cardSizeId] || CARD_SIZES.standard;
};

/**
 * Get all page size options for dropdowns
 * @returns {Array} Array of page size objects
 */
export const getPageSizeOptions = () => {
  return Object.values(PAGE_SIZES);
};

/**
 * Get all card size options for dropdowns
 * @returns {Array} Array of card size objects
 */
export const getCardSizeOptions = () => {
  return Object.values(CARD_SIZES);
};

/**
 * Internal helper function to calculate grid layout metrics
 * @param {string} pageSizeId - Page size identifier
 * @param {string} cardSizeId - Card size identifier
 * @returns {Object} Object with cardsPerRow, cardsPerColumn, and totalCardsPerPage
 */
const calculateGridMetrics = (pageSizeId, cardSizeId) => {
  const pageDimensions = getPageDimensions(pageSizeId);
  const cardDimensions = getCardDimensions(cardSizeId);
  
  // Convert dimensions to pixels for calculation (approximate)
  const cardWidthPx = parseFloat(cardDimensions.width) * 96; // 96 DPI
  const cardHeightPx = parseFloat(cardDimensions.height) * 96;
  
  // Convert page dimensions to pixels
  let pageWidthPx, pageHeightPx;
  
  if (pageDimensions.width.includes('in')) {
    // Inches to pixels
    pageWidthPx = parseFloat(pageDimensions.width) * 96;
    pageHeightPx = parseFloat(pageDimensions.height) * 96;
  } else if (pageDimensions.width.includes('mm')) {
    // Millimeters to pixels (1mm ≈ 3.78 pixels at 96 DPI)
    pageWidthPx = parseFloat(pageDimensions.width) * 3.78;
    pageHeightPx = parseFloat(pageDimensions.height) * 3.78;
  }
  
  // Account for page padding (no padding now)
  const availableWidth = pageWidthPx;
  const availableHeight = pageHeightPx;
  
  const cardsPerRow = Math.floor(availableWidth / cardWidthPx);
  const cardsPerColumn = Math.floor(availableHeight / cardHeightPx);
  
  return {
    cardsPerRow: Math.max(1, cardsPerRow),
    cardsPerColumn: Math.max(1, cardsPerColumn),
    totalCardsPerPage: Math.max(1, cardsPerRow * cardsPerColumn)
  };
};

/**
 * Calculate how many cards fit on a page
 * @param {string} pageSizeId - Page size identifier
 * @param {string} cardSizeId - Card size identifier
 * @returns {number} Number of cards that fit on the page
 */
export const calculateCardsPerPage = (pageSizeId, cardSizeId) => {
  const { totalCardsPerPage } = calculateGridMetrics(pageSizeId, cardSizeId);
  return totalCardsPerPage;
};

/**
 * Calculate grid layout (cards per row and column)
 * @param {string} pageSizeId - Page size identifier
 * @param {string} cardSizeId - Card size identifier
 * @returns {Object} Object with cardsPerRow and cardsPerColumn
 */
export const calculateGridLayout = (pageSizeId, cardSizeId) => {
  const { cardsPerRow, cardsPerColumn } = calculateGridMetrics(pageSizeId, cardSizeId);
  return { cardsPerRow, cardsPerColumn };
};
