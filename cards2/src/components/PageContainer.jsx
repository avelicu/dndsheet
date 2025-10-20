import React, { useState } from 'react';
import Page from './Page';
import './PageContainer.css';

const PageContainer = ({ spellSelection }) => {
  const [pages, setPages] = useState([{ id: 1, content: 'Empty page' }]);

  const addPage = () => {
    const newPage = {
      id: pages.length + 1,
      content: 'Empty page'
    };
    setPages([...pages, newPage]);
  };

  const removePage = (pageId) => {
    if (pages.length > 1) {
      setPages(pages.filter(page => page.id !== pageId));
    }
  };

  const getPageContent = (page) => {
    if (spellSelection && spellSelection.filteredSpells.length > 0) {
      const spellsPerPage = 6; // Adjust based on your card layout needs
      const startIndex = (page.id - 1) * spellsPerPage;
      const endIndex = startIndex + spellsPerPage;
      const pageSpells = spellSelection.filteredSpells.slice(startIndex, endIndex);
      
      if (pageSpells.length > 0) {
        return (
          <div className="spell-page-content">
            <div className="page-header">
              <h3>Page {page.id}</h3>
              <p className="spell-range">
                Spells {startIndex + 1}-{Math.min(endIndex, spellSelection.filteredSpells.length)} of {spellSelection.filteredSpells.length}
              </p>
            </div>
            <div className="spell-list">
              {pageSpells.map((spell, index) => (
                <div key={`${spell.name}-${index}`} className="spell-item">
                  <h4>{spell.name}</h4>
                  <p className="spell-level">Level {spell.level === 0 ? 'Cantrip' : spell.level}</p>
                  <p className="spell-classes">{spell.classes.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="page-content">
        <h3>Page {page.id}</h3>
        <p>{page.content}</p>
        {spellSelection && (
          <div className="selection-info">
            <p>
              {spellSelection.selectedClasses.length > 0 && spellSelection.selectedLevels.length > 0
                ? `${spellSelection.selectedClasses.length} class${spellSelection.selectedClasses.length !== 1 ? 'es' : ''}, ${spellSelection.selectedLevels.length} level${spellSelection.selectedLevels.length !== 1 ? 's' : ''} selected`
                : spellSelection.selectedClasses.length > 0
                ? `${spellSelection.selectedClasses.length} class${spellSelection.selectedClasses.length !== 1 ? 'es' : ''} selected`
                : spellSelection.selectedLevels.length > 0
                ? `${spellSelection.selectedLevels.length} level${spellSelection.selectedLevels.length !== 1 ? 's' : ''} selected`
                : 'No filters applied'
              }
            </p>
            <p className="spell-count">
              {spellSelection.spellCount} spells available
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-controls">
        <button onClick={addPage} className="add-page-btn">
          Add Page
        </button>
        <span className="page-count">
          {pages.length} page{pages.length !== 1 ? 's' : ''}
        </span>
        {spellSelection && (
          <span className="spell-count">
            {spellSelection.spellCount} spells selected
          </span>
        )}
      </div>

      <div className="pages-preview">
        {pages.map((page) => (
          <div key={page.id} className="page-wrapper">
            <Page>
              {getPageContent(page)}
            </Page>
            {pages.length > 1 && (
              <button 
                onClick={() => removePage(page.id)}
                className="remove-page-btn"
                aria-label={`Remove page ${page.id}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageContainer;
