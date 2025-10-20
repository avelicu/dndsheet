import React from 'react';
import Page from './Page';
import CardGrid from './CardGrid';
import { calculateCardsPerPage } from '../utils/layoutConfig';
import './PageContainer.css';

const PageContainer = ({ spellSelection, layoutConfig }) => {
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
  
  // Split spells into pages
  const pages = [];
  for (let i = 0; i < spellSelection.filteredSpells.length; i += cardsPerPage) {
    pages.push(spellSelection.filteredSpells.slice(i, i + cardsPerPage));
  }

  return (
    <div className="page-container">
      <div className="pages-preview">
        {pages.map((pageSpells, pageIndex) => (
          <Page key={pageIndex} layoutConfig={layoutConfig}>
            <CardGrid 
              spells={pageSpells}
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
