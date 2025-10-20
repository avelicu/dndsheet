import React, { useState, useEffect } from 'react';
import Page from './Page';
import CardGrid from './CardGrid';
import { calculateCardsPerPage } from '../utils/layoutConfig';
import { reflowCalculator } from '../utils/reflowCalculator';
import { SpellToCardDataTransformer } from '../utils/SpellToCardDataTransformer';
import './PageContainer.css';

const PageContainer = ({ spellSelection, layoutConfig }) => {
  const [reflowedCardData, setReflowedCardData] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate reflowed spells when filtered spells or layout config changes
  useEffect(() => {
    const calculateReflow = async () => {
      if (!spellSelection?.filteredSpells || spellSelection.filteredSpells.length === 0) {
        setReflowedCardData([]);
        return;
      }

      setIsCalculating(true);
      const reflowed = await reflowCalculator(
        spellSelection.filteredSpells, 
        layoutConfig?.cardSize || 'standard'
      );
      setReflowedCardData(reflowed);
      setIsCalculating(false);
    };

    calculateReflow();
  }, [spellSelection?.filteredSpells, layoutConfig?.cardSize]);

  if (!spellSelection || !spellSelection.filteredSpells || spellSelection.filteredSpells.length === 0) {
    return (
      <div className="page-container">
        <div className="no-spells-message">
          <p>No spells selected. Choose classes and/or levels to see spell cards.</p>
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
