// React App
const { useState, useEffect, useCallback, useMemo, useRef } = React;

// Store the compiled template outside of React state to avoid serialization
let compiledTemplate = null;

// Initial state
const initialState = {
    spellSelection: {
        selectedClasses: new Set(),
        selectedLevels: new Set(),
        selectedSpells: new Set()
    },
    displayParams: {
        cardSize: 'standard',
        paperSize: 'letter',
        palette: 'default',
        customWidth: '2.5',
        customHeight: '3.5'
    },
    filters: {
        showOverflowOnly: false,
        showFontReducedOnly: false
    }
};

// Load data from localStorage
function loadSettings() {
    const saved = localStorage.getItem('spellSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            return {
                spellSelection: {
                    selectedClasses: new Set(settings.spellSelection?.selectedClasses || []),
                    selectedLevels: new Set(settings.spellSelection?.selectedLevels || []),
                    selectedSpells: new Set(settings.spellSelection?.selectedSpells || [])
                },
                displayParams: {
                    ...initialState.displayParams,
                    ...settings.displayParams
                },
                filters: {
                    ...initialState.filters,
                    ...settings.filters
                }
            };
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
    return initialState;
}

// Save data to localStorage
function saveSettings(state) {
    const settings = {
        spellSelection: {
            selectedClasses: Array.from(state.spellSelection.selectedClasses),
            selectedLevels: Array.from(state.spellSelection.selectedLevels),
            selectedSpells: Array.from(state.spellSelection.selectedSpells)
        },
        displayParams: state.displayParams,
        filters: state.filters
    };
    localStorage.setItem('spellSettings', JSON.stringify(settings));
}

// Parse CSV line (handles quoted fields with semicolon delimiter)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
            } else {
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ';' && !inQuotes) {
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    result.push(current);

    if (result.length >= 10) {
        return {
            level: result[0],
            title: result[1],
            school_of_magic: result[2],
            casting_time: result[3],
            range: result[4],
            components: result[5],
            duration: result[6],
            description: result[7],
            material_component: result[8],
            classes: result[9]
        };
    }
    
    return null;
}

// Load card template
async function loadCardTemplate() {
    console.log('🔄 Loading card template...');
    
    try {
        // Check if Handlebars is available
        if (typeof Handlebars === 'undefined') {
            console.error('❌ Handlebars is not loaded');
            console.log('🔄 Using fallback template...');
            return createFallbackTemplate();
        }
        console.log('✅ Handlebars is available');
        
        // Test Handlebars functionality
        try {
            const testTemplate = Handlebars.compile('Hello {{name}}!');
            const testResult = testTemplate({name: 'World'});
            console.log('✅ Handlebars test successful:', testResult);
        } catch (testError) {
            console.error('❌ Handlebars test failed:', testError);
            console.log('🔄 Using fallback template...');
            return createFallbackTemplate();
        }

        console.log('📡 Fetching card_template.html...');
        const response = await fetch('card_template.html');
        
        if (!response.ok) {
            console.error('❌ Failed to fetch template:', response.status, response.statusText);
            console.log('🔄 Using fallback template...');
            return createFallbackTemplate();
        }
        console.log('✅ Template file fetched successfully');
        
        const templateString = await response.text();
        if (!templateString) {
            console.error('❌ Template file is empty');
            console.log('🔄 Using fallback template...');
            return createFallbackTemplate();
        }
        console.log('✅ Template content loaded:', templateString.length, 'characters');
        console.log('  - Template preview:', templateString.substring(0, 100) + '...');

        console.log('🔧 Compiling template with Handlebars...');
        console.log('  - Handlebars object:', Handlebars);
        console.log('  - Handlebars.compile:', typeof Handlebars.compile);
        
        const compiledTemplate = Handlebars.compile(templateString);
        console.log('✅ Template compiled successfully');
        console.log('  - compiledTemplate:', compiledTemplate);
        console.log('  - compiledTemplate type:', typeof compiledTemplate);
        console.log('  - compiledTemplate is function:', typeof compiledTemplate === 'function');
        
        // Test the compiled template
        if (typeof compiledTemplate === 'function') {
            try {
                const testResult = compiledTemplate({spellTitle: 'Test Spell'});
                console.log('✅ Template test successful:', testResult.substring(0, 50) + '...');
            } catch (testError) {
                console.error('❌ Template test failed:', testError);
            }
        }
        
        return compiledTemplate;
    } catch (error) {
        console.error('❌ Error loading card template:', error);
        console.log('🔄 Using fallback template...');
        return createFallbackTemplate();
    }
}

// Create a fallback template function if Handlebars fails
function createFallbackTemplate() {
    console.log('Using fallback template');
    return function(data) {
        return `
            <div class="spell-card">
                <div class="spell-name">
                    ${data.isRitual ? '<div class="ritual-indicator"><span>R</span></div>' : ''}
                    <span class="spell-title-text">${data.spellTitle || 'Unknown Spell'}</span>
                    ${data.levelText ? `<div class="spell-level-circle"><span>${data.levelText}</span></div>` : ''}
                </div>
                <div class="spell-content">
                    <div class="spell-header"></div>
                    ${data.hasHeader ? `
                        <div class="spell-header-bar">
                            <div class="spell-header-column">
                                <div class="spell-header-label">RANGE</div>
                                <div class="spell-header-value">${data.formattedRange || ''}</div>
                            </div>
                            <div class="spell-header-column">
                                <div class="spell-header-label">COMPONENTS</div>
                                <div class="spell-header-value">${data.formattedComponents || ''}</div>
                            </div>
                            <div class="spell-header-column">
                                <div class="spell-header-label">DURATION</div>
                                <div class="spell-header-value">${data.formattedDuration || ''}</div>
                            </div>
                            <div class="spell-header-column">
                                <div class="spell-header-label">CASTING TIME</div>
                                <div class="spell-header-value">${data.formattedCastingTime || ''}</div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="spell-body">
                        <div class="spell-description">
                            <div class="spell-description-content">
                                ${data.formattedMaterialComponent ? `<em>Material Component:</em> ${data.formattedMaterialComponent}<br/><br/>` : ''}
                                <span class="description-content">${data.description || 'No description available'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="spell-footer">
                    <div class="spell-school">${data.school_of_magic || 'Unknown'}</div>
                    <div class="spell-classes">${data.classes || 'Unknown'}</div>
                </div>
            </div>
        `;
    };
}

// Load spells from CSV
async function loadSpells() {
    try {
        const response = await fetch('all_spells.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n');

        const spells = [];
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const spell = parseCSVLine(line);
                if (spell) {
                    spells.push(spell);
                }
            }
        }

        // Sort spells by level first, then by name
        spells.sort((a, b) => {
            const levelA = parseInt(a.level);
            const levelB = parseInt(b.level);
            if (levelA !== levelB) {
                return levelA - levelB;
            }
            return a.title.localeCompare(b.title);
        });

        return spells;
    } catch (error) {
        console.error('Error loading spells:', error);
        return [];
    }
}

// React Components
const FilterGroup = ({ title, children }) => (
    <div className="filter-group">
        <h3>{title}</h3>
        {children}
    </div>
);

const FilterOptions = ({ options, selected, onChange, allOption = null }) => {
    const handleAllChange = (checked) => {
        const checkboxes = document.querySelectorAll(`#${options[0].containerId || 'classFilters'} input[type="checkbox"]:not(#all_${options[0].type})`);
        checkboxes.forEach(cb => cb.checked = checked);

        const selectedValues = checked ?
            new Set(options.map(opt => opt.value)) :
            new Set();

        onChange(selectedValues);
    };

    const handleIndividualChange = (value, checked) => {
        const newSelected = new Set(selected);
        if (checked) {
            newSelected.add(value);
        } else {
            newSelected.delete(value);
        }
        onChange(newSelected);
    };

    return (
        <div className="filter-options">
            {allOption && (
                <div className="filter-option">
                    <input
                        type="checkbox"
                        id={`all_${allOption.type}`}
                        checked={selected.size === options.length}
                        onChange={(e) => handleAllChange(e.target.checked)}
                    />
                    <label htmlFor={`all_${allOption.type}`}>{allOption.label}</label>
                </div>
            )}
            {options.map(option => (
                <div key={option.value} className="filter-option">
                    <input
                        type="checkbox"
                        id={`${option.type}_${option.value}`}
                        value={option.value}
                        checked={selected.has(option.value)}
                        onChange={(e) => handleIndividualChange(option.value, e.target.checked)}
                    />
                    <label htmlFor={`${option.type}_${option.value}`}>{option.label}</label>
                </div>
            ))}
        </div>
    );
};

const SpellSelector = ({ spells, selectedSpells, onSpellToggle, searchTerm, onSearchChange }) => {
    const filteredSpells = useMemo(() =>
        spells.filter(spell =>
            spell.title.toLowerCase().includes(searchTerm.toLowerCase())
        ), [spells, searchTerm]
    );

    return (
        <div className="spell-selector">
            <input
                type="text"
                placeholder="Search spells..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <div id="spellCheckboxes" className="filter-options">
                {filteredSpells.map(spell => (
                    <div key={spell.title} className="filter-option">
                        <input
                            type="checkbox"
                            id={`spell_${spell.title.replace(/\s+/g, '_')}`}
                            checked={selectedSpells.has(spell.title)}
                            onChange={(e) => onSpellToggle(spell.title, e.target.checked)}
                        />
                        <label htmlFor={`spell_${spell.title.replace(/\s+/g, '_')}`}>
                            {spell.title}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsGroup = ({ title, children }) => (
    <div className="filter-group">
        <h3>{title}</h3>
        {children}
    </div>
);

const App = () => {
    const [state, setState] = useState(loadSettings);
    const [spells, setSpells] = useState([]);
    const [templateLoaded, setTemplateLoaded] = useState(false); // Boolean flag instead of template function
    const [searchTerm, setSearchTerm] = useState('');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            console.log('🔄 Starting data loading...');
            
            try {
                const [template, spellsData] = await Promise.all([
                    loadCardTemplate(),
                    loadSpells()
                ]);

                console.log('📊 Data loading results:');
                console.log('  - Template:', template ? '✅ Loaded' : '❌ Failed');
                console.log('  - Template type:', typeof template);
                console.log('  - Template is function:', typeof template === 'function');
                console.log('  - Spells:', spellsData ? `${spellsData.length} spells` : '❌ Failed');

        console.log('🔄 Setting state...');
        compiledTemplate = template; // Store in module variable instead of React state
        setSpells(spellsData);
        setTemplateLoaded(true); // Set boolean flag to true
        console.log('✅ State set complete');
        console.log('✅ Template stored in module variable:', typeof compiledTemplate === 'function');
            } catch (error) {
                console.error('❌ Error during data loading:', error);
            }
        };

        loadData();
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        saveSettings(state);
    }, [state]);

    // Monitor template loading
    useEffect(() => {
        console.log('🔄 templateLoaded state changed:', templateLoaded);
        console.log('  - compiledTemplate:', compiledTemplate);
        console.log('  - compiledTemplate type:', typeof compiledTemplate);
        console.log('  - compiledTemplate is function:', typeof compiledTemplate === 'function');
    }, [templateLoaded]);

    // Update filtered spells whenever state changes
    const filteredSpells = useMemo(() => {
        let result = [...spells];

        // Apply class filters
        if (state.spellSelection.selectedClasses.size > 0) {
            result = result.filter(spell =>
                Array.from(state.spellSelection.selectedClasses).some(cls =>
                    spell.classes.includes(cls)
                )
            );
        }

        // Apply level filters
        if (state.spellSelection.selectedLevels.size > 0) {
            result = result.filter(spell =>
                state.spellSelection.selectedLevels.has(spell.level)
            );
        }

        // Apply spell selection
        if (state.spellSelection.selectedSpells.size > 0) {
            result = result.filter(spell =>
                state.spellSelection.selectedSpells.has(spell.title)
            );
        }

        return result;
    }, [spells, state.spellSelection]);

    // Generate available classes and levels
    const availableClasses = useMemo(() => {
        const classes = new Set();
        spells.forEach(spell => {
            spell.classes.split(', ').forEach(cls => classes.add(cls.trim()));
        });
        return Array.from(classes).sort().map(cls => ({ value: cls, label: cls, type: 'class' }));
    }, [spells]);

    const availableLevels = useMemo(() => {
        const levels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return levels.map(level => ({
            value: level,
            label: level === '0' ? 'Cantrip' : `Level ${level}`,
            type: 'level'
        }));
    }, []);

    // Event handlers
    const updateSpellSelection = (updates) => {
        setState(prev => ({
            ...prev,
            spellSelection: { ...prev.spellSelection, ...updates }
        }));
    };

    const updateDisplayParams = (updates) => {
        setState(prev => ({
            ...prev,
            displayParams: { ...prev.displayParams, ...updates }
        }));
    };

    const updateFilters = (updates) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, ...updates }
        }));
    };

    // Update DOM data attributes when display params change
    useEffect(() => {
        document.documentElement.dataset.cardSize = state.displayParams.cardSize;
        document.documentElement.dataset.paperSize = state.displayParams.paperSize;
        document.documentElement.dataset.theme = state.displayParams.palette;
    }, [state.displayParams]);

    // Update custom input visibility
    useEffect(() => {
        const customSizeInputs = document.getElementById('customSizeInputs');
        if (customSizeInputs) {
            customSizeInputs.style.display = state.displayParams.cardSize === 'custom' ? 'flex' : 'none';
        }
    }, [state.displayParams.cardSize]);

    // Re-render cards when filtered spells change
    useEffect(() => {
        console.log('🔄 useEffect triggered for card rendering:');
        console.log('  - templateLoaded:', templateLoaded);
        console.log('  - compiledTemplate:', compiledTemplate);
        console.log('  - compiledTemplate type:', typeof compiledTemplate);
        console.log('  - filteredSpells.length:', filteredSpells.length);
        
        if (templateLoaded && compiledTemplate && typeof compiledTemplate === 'function') {
            console.log('✅ Calling displaySpells...');
            displaySpells(filteredSpells, compiledTemplate, state);
        } else {
            console.log('⏳ Template not ready yet, skipping render');
        }
    }, [filteredSpells, templateLoaded, state]);

    return (
        <div>
            <div className="header">
                <h1>D&D 5e Spell Cards</h1>
                <p>Complete spell reference with filtering and pagination</p>
            </div>

            <div className="filters">
                <div className="filter-groups-container">
                    <FilterGroup title="Classes">
                        <FilterOptions
                            options={availableClasses}
                            selected={state.spellSelection.selectedClasses}
                            onChange={(selected) => updateSpellSelection({ selectedClasses: selected })}
                            allOption={{ type: 'class', label: 'All Classes' }}
                        />
                    </FilterGroup>

                    <FilterGroup title="Levels">
                        <FilterOptions
                            options={availableLevels}
                            selected={state.spellSelection.selectedLevels}
                            onChange={(selected) => updateSpellSelection({ selectedLevels: selected })}
                            allOption={{ type: 'level', label: 'All Levels' }}
                        />
                    </FilterGroup>

                    <FilterGroup title="Additional Spells">
                        <SpellSelector
                            spells={spells}
                            selectedSpells={state.spellSelection.selectedSpells}
                            onSpellToggle={(spellTitle, checked) => {
                                const newSelected = new Set(state.spellSelection.selectedSpells);
                                if (checked) {
                                    newSelected.add(spellTitle);
                                } else {
                                    newSelected.delete(spellTitle);
                                }
                                updateSpellSelection({ selectedSpells: newSelected });
                            }}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />
                    </FilterGroup>
                </div>

                <div className="reset-button-container">
                    <button onClick={() => {
                        setState(initialState);
                        setSearchTerm('');
                    }}>
                        Reset
                    </button>
                </div>

                <div className="settings-groups-container">
                    <SettingsGroup title="Card Size & Paper">
                        <div className="size-selector">
                            <select
                                value={state.displayParams.cardSize}
                                onChange={(e) => updateDisplayParams({ cardSize: e.target.value })}
                            >
                                <option value="standard">Standard Trading Cards (2.5" × 3.5")</option>
                                <option value="mini">Mini Cards (1.5" × 2.5")</option>
                                <option value="large">Large Cards (3.5" × 5")</option>
                                <option value="custom">Custom Size</option>
                            </select>
                            <div id="customSizeInputs" style={{ display: state.displayParams.cardSize === 'custom' ? 'flex' : 'none' }}>
                                <input
                                    type="number"
                                    value={state.displayParams.customWidth}
                                    onChange={(e) => updateDisplayParams({ customWidth: e.target.value })}
                                    placeholder="Width (inches)"
                                    step="0.1"
                                    min="0.5"
                                    max="8"
                                />
                                <input
                                    type="number"
                                    value={state.displayParams.customHeight}
                                    onChange={(e) => updateDisplayParams({ customHeight: e.target.value })}
                                    placeholder="Height (inches)"
                                    step="0.1"
                                    min="0.5"
                                    max="12"
                                />
                            </div>
                        </div>
                        <div className="paper-selector">
                            <select
                                value={state.displayParams.paperSize}
                                onChange={(e) => updateDisplayParams({ paperSize: e.target.value })}
                            >
                                <option value="letter">Letter (8.5" × 11")</option>
                                <option value="a4">A4 (8.27" × 11.69")</option>
                                <option value="legal">Legal (8.5" × 14")</option>
                                <option value="tabloid">Tabloid (11" × 17")</option>
                            </select>
                            <div className="settings-info">
                                💡 When printing, select "No margins" or "Minimum margins" as proper spacing is already included.
                            </div>
                        </div>
                    </SettingsGroup>

                    <SettingsGroup title="Appearance">
                        <div className="palette-selector">
                            <select
                                value={state.displayParams.palette}
                                onChange={(e) => updateDisplayParams({ palette: e.target.value })}
                            >
                                <option value="none">No Background</option>
                                <option value="default">Default Palette</option>
                                <option value="fire">Fire Theme</option>
                                <option value="ice">Ice Theme</option>
                                <option value="nature">Nature Theme</option>
                                <option value="shadow">Shadow Theme</option>
                                <option value="arcane">Arcane Theme</option>
                                <option value="black">Black Theme</option>
                            </select>
                        </div>
                    </SettingsGroup>
                </div>
            </div>

            <div className="paper-container" id="paperContainer">
                <div className="spell-grid" id="spellGrid">
                    {!templateLoaded ? (
                        <div style={{textAlign: 'center', padding: '50px', fontFamily: 'Arial, sans-serif'}}>
                            <div style={{fontSize: '18px', marginBottom: '20px'}}>Loading Spell Cards...</div>
                            <div style={{fontSize: '14px', color: '#666'}}>Please wait while the template loads</div>
                        </div>
                    ) : (
                        <div>Cards will be rendered here</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Display spells function for React
const displaySpells = async (spellsToRender, template, state) => {
    console.log('🎯 displaySpells called with:');
    console.log('  - spellsToRender.length:', spellsToRender.length);
    console.log('  - template:', template);
    console.log('  - template type:', typeof template);
    console.log('  - template is function:', typeof template === 'function');
    
    // Check if template is available
    if (!template || typeof template !== 'function') {
        console.error('❌ Cannot display spells: template is not available');
        console.error('  - template value:', template);
        console.error('  - template type:', typeof template);
        const paperContainer = document.getElementById('paperContainer');
        if (paperContainer) {
            paperContainer.innerHTML = '<div class="spell-grid"><div class="no-spells">Template not loaded. Please refresh the page.</div></div>';
        }
        return;
    }

    // Wait for all fonts to be loaded and ready
    await document.fonts.ready;
    const paperContainer = document.getElementById('paperContainer');

    // Show progress indicator
    paperContainer.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"><div style="font-size: 18px; margin-bottom: 20px;">Generating Spell Cards...</div><div style="width: 300px; height: 20px; background: #e0e0e0; border-radius: 10px; margin: 0 auto;"><div id="progressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50; transition: width 0.3s ease; border-radius: 10px;"></div></div></div>';

    if (spellsToRender.length === 0) {
        setTimeout(() => {
            paperContainer.innerHTML = '<div class="spell-grid"><div class="cutting-guide cutting-guide-vertical-1"></div><div class="cutting-guide cutting-guide-vertical-2"></div><div class="cutting-guide cutting-guide-horizontal-1"></div><div class="cutting-guide cutting-guide-horizontal-2"></div><div class="no-spells">No spells found matching your criteria.</div></div>';
        }, 100);
    } else {
        // Sort spells by level first, then alphabetically by name
        const sortedSpells = [...spellsToRender].sort((a, b) => {
            const levelA = parseInt(a.level);
            const levelB = parseInt(b.level);
            if (levelA !== levelB) {
                return levelA - levelB;
            }
            return a.title.localeCompare(b.title);
        });

        // Calculate how many cards fit per page dynamically based on current settings
        const cardSize = state.displayParams.cardSize;
        const cardSizes = {
            standard: { width: 2.5, height: 3.5 },
            mini: { width: 1.5, height: 2.5 },
            large: { width: 3.5, height: 5.0 },
            custom: {
                width: parseFloat(state.displayParams.customWidth) || 2.5,
                height: parseFloat(state.displayParams.customHeight) || 3.5
            }
        };

        const currentCardSize = cardSizes[cardSize] || cardSizes.standard;
        const currentPaperSize = {
            letter: { width: 8.5, height: 11.0 },
            a4: { width: 8.27, height: 11.69 },
            legal: { width: 8.5, height: 14.0 },
            tabloid: { width: 11.0, height: 17.0 }
        }[state.displayParams.paperSize] || { width: 8.5, height: 11.0 };

        const availableWidth = currentPaperSize.width;
        const availableHeight = currentPaperSize.height;
        const cardsPerRow = Math.floor(availableWidth / currentCardSize.width);
        const cardsPerCol = Math.floor(availableHeight / currentCardSize.height);
        const cardsPerPage = cardsPerRow * cardsPerCol;

        // Generate all cards first to count actual cards (some spells may generate 2 cards)
        const allCards = [];
        const totalSpells = sortedSpells.length;

        for (let i = 0; i < sortedSpells.length; i++) {
            const spell = sortedSpells[i];
            const cardHTML = await createSpellCard(spell, template);

            // Update progress bar
            const progress = Math.round(((i + 1) / totalSpells) * 100);
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            // Count how many cards this spell generated (look for spell-card class)
            const cardMatches = cardHTML.match(/class="spell-card"/g);
            const cardCount = cardMatches ? cardMatches.length : 1;

            // Split the HTML into individual cards if needed
            if (cardCount > 1) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHTML;
                const cards = tempDiv.querySelectorAll('.spell-card');
                cards.forEach(card => {
                    allCards.push(card.outerHTML);
                });
            } else {
                allCards.push(cardHTML);
            }
        }

        const totalPages = Math.ceil(allCards.length / cardsPerPage);

        let html = '';
        for (let page = 0; page < totalPages; page++) {
            const startIndex = page * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, allCards.length);
            const pageCards = allCards.slice(startIndex, endIndex);

            html += `<div class="spell-grid">${pageCards.join('')}</div>`;
        }

        paperContainer.innerHTML = html;
    }
};

// Create spell card HTML with overflow detection
async function createSpellCard(spell, template) {
    // Generate card data
    const cardData = generateSpellCardData(spell);

    // First, render the card normally
    const normalCardHTML = renderSpellCard(spell, cardData, {}, false, template);

    // Get or create reusable temporary divs
    let constrainedTemp = document.getElementById('reusable-constrained-temp');
    let unconstrainedTemp = document.getElementById('reusable-unconstrained-temp');

    if (!constrainedTemp) {
        constrainedTemp = document.createElement('div');
        constrainedTemp.id = 'reusable-constrained-temp';
        constrainedTemp.style.position = 'absolute';
        constrainedTemp.style.visibility = 'hidden';
        constrainedTemp.style.top = '-9999px';
        constrainedTemp.style.left = '-9999px';
        document.body.appendChild(constrainedTemp);
    }

    if (!unconstrainedTemp) {
        unconstrainedTemp = document.createElement('div');
        unconstrainedTemp.id = 'reusable-unconstrained-temp';
        unconstrainedTemp.style.position = 'absolute';
        unconstrainedTemp.style.visibility = 'hidden';
        unconstrainedTemp.style.top = '-9999px';
        unconstrainedTemp.style.left = '-9999px';
        document.body.appendChild(unconstrainedTemp);
    }

    // Check if title fits and adjust letter spacing if needed
    let finalCardHTML = normalCardHTML;

    // Create a temporary card to measure title height
    const titleTestTemp = document.createElement('div');
    titleTestTemp.style.position = 'absolute';
    titleTestTemp.style.visibility = 'hidden';
    titleTestTemp.style.top = '-9999px';
    titleTestTemp.style.left = '-9999px';
    titleTestTemp.innerHTML = normalCardHTML;
    document.body.appendChild(titleTestTemp);

    const titleElement = titleTestTemp.querySelector('.spell-title-text');
    if (titleElement) {
        const titleText = titleElement.textContent;

        // Force a reflow to get accurate measurements
        void titleElement.offsetHeight;

        let titleHeight = titleElement.offsetHeight;
        let targetHeight = 16; // Prefer single row (approximately 16px)
        let letterSpacing = -1; // Start with current letter spacing
        let bestLetterSpacing = -1; // Track the best working letter spacing

        console.log(`Title "${titleText}": height=${titleHeight}px, target=${targetHeight}px, needsAdjustment=${titleHeight > targetHeight}`);

        // If title is taller than single row, progressively reduce letter spacing
        while (titleHeight > targetHeight && letterSpacing > -3) {
            letterSpacing -= 0.1;
            titleElement.style.letterSpacing = letterSpacing + 'px';
            void titleElement.offsetHeight; // Force reflow
            titleHeight = titleElement.offsetHeight;
            console.log(`  Trying letterSpacing=${letterSpacing}px: height=${titleHeight}px`);

            if (titleHeight <= targetHeight) {
                bestLetterSpacing = letterSpacing;
                break;
            }
        }

        // If we found a good letter spacing, re-render the card with it
        if (bestLetterSpacing !== -1) {
            const styleOverrides = { nameStyle: `letter-spacing: ${bestLetterSpacing}px;` };
            finalCardHTML = renderSpellCard(spell, cardData, styleOverrides, false, template);
        }
    }

    document.body.removeChild(titleTestTemp);

    constrainedTemp.innerHTML = finalCardHTML;
    unconstrainedTemp.innerHTML = finalCardHTML;

    // Force unconstrained card to its full height
    const unconstrainedCard = unconstrainedTemp.querySelector('.spell-card');
    if (unconstrainedCard) {
        unconstrainedCard.style.setProperty('height', 'auto', 'important');
    }
    const unconstrainedContent = unconstrainedTemp.querySelector('.spell-content');
    if (unconstrainedContent) {
        unconstrainedContent.style.setProperty('height', 'auto', 'important');
        unconstrainedContent.style.setProperty('flex', '0 0 auto', 'important');
    }
    const unconstrainedBody = unconstrainedTemp.querySelector('.spell-body');
    if (unconstrainedBody) {
        unconstrainedBody.style.setProperty('height', 'auto', 'important');
        unconstrainedBody.style.setProperty('flex', '0 0 auto', 'important');
    }
    const unconstrainedDesc = unconstrainedTemp.querySelector('.spell-description');
    if (unconstrainedDesc) {
        unconstrainedDesc.style.setProperty('height', 'auto', 'important');
        unconstrainedDesc.style.setProperty('flex', '0 0 auto', 'important');
    }

    // Force a reflow to ensure the browser recalculates the layout
    // void unconstrainedTemp.offsetHeight;

    // Compare the overall card heights to detect overflow
    const constrainedCardHeight = constrainedTemp.querySelector('.spell-card')?.offsetHeight || 0;
    const unconstrainedCardHeight = unconstrainedCard?.offsetHeight || 0;

    const hasOverflow = unconstrainedCardHeight > constrainedCardHeight;

    const isDebugSpell = spell.title === 'Summon Fey';

    if (hasOverflow) {
        spell._hasOverflow = true; // Mark for debug filtering
        if (isDebugSpell) {
            console.log(`${spell.title} overflows: ${unconstrainedCardHeight}px > ${constrainedCardHeight}px`);
        }

        // Try to fix overflow by reducing font size
        let fontSize = 100; // Start at 100%
        let minFontSize = 70;
        let bestFontSize = -1;

        while (fontSize >= minFontSize) {
            const scale = fontSize / 100;
            const styleOverrides = { bodyStyle: `font-size: ${scale}em;` };
            const testCardHTML = renderSpellCard(spell, cardData, styleOverrides, false, template);

            unconstrainedTemp.innerHTML = testCardHTML;

            // Force reflow to get accurate measurements
            void unconstrainedTemp.offsetHeight;

            const testCardHeight = unconstrainedTemp.querySelector('.spell-card')?.offsetHeight || 0;

            if (isDebugSpell) {
                console.log(`  Trying font size ${fontSize}%: height=${testCardHeight}px, fits=${testCardHeight <= constrainedCardHeight}`);
            }

            if (testCardHeight <= constrainedCardHeight) {
                bestFontSize = fontSize;
                break;
            }

            fontSize -= 2;
        }

        if (bestFontSize !== -1) {
            spell._fontSizeReduced = true; // Mark for debug filtering
            const scale = bestFontSize / 100;
            const styleOverrides = { bodyStyle: `font-size: ${scale}em;` };

            if (isDebugSpell) {
                console.log(`${spell.title}: Found best font size: ${bestFontSize}%`);
            }

            return renderSpellCard(spell, cardData, styleOverrides, false, template);
        } else {
            // No font size reduction helps, split the card
            if (isDebugSpell) {
                console.log(`${spell.title}: No font size reduction helps, splitting card`);
            }

            return await splitCardContent(spell, cardData, finalCardHTML, false, template);
        }
    }

    return finalCardHTML;
}

// Render spell card to HTML
function renderSpellCard(spell, cardData, styleOverrides = {}, isContinuation = false, template) {
    // Check if template is available
    if (!template || typeof template !== 'function') {
        console.error('Template is not available or not a function:', template);
        return '<div class="spell-card"><div class="spell-name">Template Error</div><div class="spell-content">Failed to load template</div></div>';
    }

    try {
        // Pass the data to the compiled Handlebars template
        const html = template({ ...cardData, isContinuation });

        // Create a temporary DOM element to apply styles
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const cardElement = tempDiv.firstElementChild;

        // Apply style overrides
        if (cardElement && Object.keys(styleOverrides).length > 0) {
            if (styleOverrides.cardStyle) cardElement.style.cssText += styleOverrides.cardStyle;

            const nameElement = cardElement.querySelector('.spell-name');
            if (nameElement && styleOverrides.nameStyle) nameElement.style.cssText += styleOverrides.nameStyle;

            const contentElement = cardElement.querySelector('.spell-content');
            if (contentElement && styleOverrides.contentStyle) contentElement.style.cssText += styleOverrides.contentStyle;

            const bodyElement = cardElement.querySelector('.spell-body');
            if (bodyElement && styleOverrides.bodyStyle) bodyElement.style.cssText += styleOverrides.bodyStyle;

            const footerElement = cardElement.querySelector('.spell-footer');
            if (footerElement && styleOverrides.footerStyle) footerElement.style.cssText += styleOverrides.footerStyle;
        }

        return cardElement.outerHTML;
    } catch (error) {
        console.error('Error rendering spell card:', error);
        return '<div class="spell-card"><div class="spell-name">Render Error</div><div class="spell-content">Failed to render card</div></div>';
    }
}

// Generate spell card data (shared between actual and measurement rendering)
function generateSpellCardData(spell) {
    const isContinuation = spell.title.includes('(Cont.)');

    // Use description exactly as provided
    let description = spell.description;

    // Process HTML tags and line breaks
    if (description) {
        // Convert line breaks to <br> tags
        description = description.replace(/\n/g, '<br>');
        // HTML tags will be rendered as-is since we're inserting into innerHTML
    }

    // Process components to extract material components
    let components = spell.components || '';
    let materialComponent = spell.material_component || '';

    // Look for material components in parentheses in the components field
    const materialMatch = components.match(/\(([^)]+)\)/);
    if (materialMatch) {
        // Extract the material component text
        const materialText = materialMatch[1];
        // Remove it from components
        components = components.replace(/\([^)]+\)/, '').trim();
        // Add it to material component (append if there's already one)
        if (materialComponent) {
            materialComponent += '; ' + materialText;
        } else {
            materialComponent = materialText;
        }
    }

    // Bold dice expressions and color damage types
    const damageTypes = {
        'fire': '#DC2626',      // red
        'cold': '#3B82F6',      // blue
        'lightning': '#F59E0B',  // amber
        'thunder': '#8B5CF6',    // purple
        'acid': '#10B981',      // emerald
        'poison': '#059669',     // green
        'necrotic': '#6B7280',   // gray
        'radiant': '#FBBF24',    // yellow
        'psychic': '#EC4899',   // pink
        'force': '#6366F1',     // indigo
        'bludgeoning': '#92400E', // brown
        'piercing': '#374151',   // dark gray
        'slashing': '#7C2D12'    // dark red
    };

    // First, handle dice + damage type combinations
    description = description.replace(/\b(\d*d\d+(?:\+\d+)?)\s+(fire|cold|lightning|thunder|acid|poison|necrotic|radiant|psychic|force|bludgeoning|piercing|slashing)\b/gi,
        (match, dice, damageType) => {
            const color = damageTypes[damageType.toLowerCase()] || '#000000';
            return `<strong style="color: ${color};">${dice} ${damageType}</strong>`;
        });

    // Then handle standalone dice expressions
    description = description.replace(/\b(\d*d\d+(?:\+\d+)?)\b/g, '<strong>$1</strong>');

    // Bold saving throw expressions
    description = description.replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+saving\s+throw\b/gi, '<strong>$1 saving throw</strong>');

    // Bold and color standalone damage types (not already processed with dice)
    description = description.replace(/\b(fire|cold|lightning|thunder|acid|poison|necrotic|radiant|psychic|force|bludgeoning|piercing|slashing)\s+damage\b/gi,
        (match, damageType) => {
            const color = damageTypes[damageType.toLowerCase()] || '#000000';
            return `<strong style="color: ${color};">${damageType} damage</strong>`;
        });

    // Bold conditions
    description = description.replace(/\b(blinded|charmed|deafened|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious|exhausted|confused|dominated|dazed|staggered)\b/gi, '<strong>$1</strong>');

    // Bold range expressions (distance part only)
    description = description.replace(/\b(\d+(?:\.\d+)?)\s+(feet|ft|miles|mi)\b/gi, '<strong>$1 $2</strong>');

    // Format material component gold amounts
    let formattedMaterialComponent = materialComponent;
    if (formattedMaterialComponent) {
        // Bold and color gold amounts (e.g., "50 gp", "100 gold pieces", "25 gold")
        formattedMaterialComponent = formattedMaterialComponent.replace(/\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(gp|gold\s+pieces?|gold)\b/gi,
            '<strong style="color: #B8860B;">$1 $2</strong>');

        // Bold "which the spell consumes" if present
        formattedMaterialComponent = formattedMaterialComponent.replace(/\b(which the spell consumes)\b/gi, '<strong>$1</strong>');
    }

    // Format components
    let formattedComponents = isContinuation ? '' : (components || '');

    // Format duration with concentration indicator
    let formattedDuration = isContinuation ? '' : spell.duration;
    if (formattedDuration && formattedDuration.includes('Concentration')) {
        const match = formattedDuration.match(/Concentration, (up to \d+ \w+)/);
        if (match) {
            formattedDuration = `<span class="concentration-indicator">C</span> ≤ ${match[1].replace('up to ', '').replace(/^(an?|the)\s+/i, '')}`;
        } else {
            formattedDuration = `<span class="concentration-indicator">C</span> ${formattedDuration.replace('Concentration, ', '')}`;
        }
    }

    // Format casting time
    let formattedCastingTime = isContinuation ? '' : spell.casting_time;
    if (formattedCastingTime) {
        // Replace "feet" with "ft"
        formattedCastingTime = formattedCastingTime.replace(/\bfeet\b/g, 'ft');
    }

    // Format range
    let formattedRange = isContinuation ? '' : spell.range;
    if (formattedRange) {
        formattedRange = formattedRange.replace(/\bfeet\b/g, 'ft');
    }

    // Handle ritual spells - add ritual indicator and remove (ritual) from title
    let spellTitle = spell.title;
    let isRitual = false;

    if (spell.title.includes('(ritual)') || spell.title.includes('(Ritual)')) {
        isRitual = true;
        spellTitle = spell.title.replace(/\([Rr]itual\)/g, '').trim();
    }

    if (isContinuation) {
        spellTitle = spell.title.replace(/\(Cont\.\)/g, '').trim();
    }

    const hasHeader = !!(formattedRange || formattedComponents || formattedDuration || formattedCastingTime);
    const levelText = isContinuation ? '' : (spell.level === '0' ? '0' : spell.level);

    return {
        levelText,
        description,
        formattedComponents,
        formattedDuration,
        formattedCastingTime,
        formattedRange,
        spellTitle,
        isRitual,
        hasHeader,
        formattedMaterialComponent,
        school_of_magic: spell.school_of_magic,
        classes: spell.classes
    };
}

// Split overflowing card content into two cards
async function splitCardContent(spell, cardData, normalCardHTML, isContinuation = false, template) {
    // Get the full description text exactly as provided
    const baseDescription = spell.description;

    // Find a good split point in the description (e.g., at a paragraph break)
    const paragraphs = baseDescription.split('<br><br>');
    let splitPoint = -1;

    if (paragraphs.length > 1) {
        // Find the middle paragraph
        let middleIndex = Math.floor(paragraphs.length / 2);
        splitPoint = paragraphs.slice(0, middleIndex).join('<br><br>').length + 8;
    } else {
        // Find the middle of the description
        splitPoint = Math.floor(baseDescription.length / 2);
    }

    // Binary search for the best split point
    let low = 0;
    let high = baseDescription.length;
    let bestSplit = -1;
    let iterations = 0;
    const isDebugSpell = spell.title === 'Summon Fey';

    const targetHeightPx = 96 - 20; // inches to pixels, with some buffer

    while (low <= high && iterations < 50) {
        iterations++;
        splitPoint = Math.floor((low + high) / 2);

        // Find the nearest word boundary
        while (splitPoint < baseDescription.length && !/\s/.test(baseDescription[splitPoint])) {
            splitPoint++;
        }

        const firstPart = baseDescription.substring(0, splitPoint);

        // Create a test card with the first part
        const testCardData = { ...cardData, description: firstPart };
        const testCardHTML = renderSpellCard(spell, testCardData, {}, false, template);

        const testTemp = document.getElementById('reusable-unconstrained-temp');
        testTemp.innerHTML = testCardHTML;

        const testBody = testTemp.querySelector('.spell-body');
        if (testBody) {
            testBody.style.setProperty('height', 'auto', 'important');
        }

        const testCardHeight = await new Promise(resolve => {
            requestAnimationFrame(() => {
                const height = testTemp.querySelector('.spell-card')?.offsetHeight || 0;
                resolve(height);
            });
        });

        if (isDebugSpell && iterations <= 5) {
            console.log(`  Iteration ${iterations}, splitPoint=${splitPoint}: height=${testCardHeight}px, target=${targetHeightPx}px, fits=${testCardHeight <= targetHeightPx}`);
        }

        if (testCardHeight <= targetHeightPx) {
            bestSplit = splitPoint;
            low = splitPoint + 1;
        } else {
            high = splitPoint - 1;
        }
    }

    if (bestSplit === -1) {
        bestSplit = Math.floor(baseDescription.length / 2);
    }

    if (isDebugSpell) {
        console.log(`Final split point: ${bestSplit}`);
    }

    // Create the first card with the truncated description
    const firstPart = baseDescription.substring(0, bestSplit);
    const firstCardData = { ...cardData, description: firstPart };
    const firstCardHTML = renderSpellCard(spell, firstCardData, {}, false, template);

    // Create the second card with the remaining description
    const secondPart = baseDescription.substring(bestSplit);

    // Create a new spell object for the second card (continuation)
    const secondSpell = { ...spell, title: `${spell.title} (Cont.)`, description: secondPart };
    const secondCardData = generateSpellCardData(secondSpell);
    const secondCardHTML = renderSpellCard(secondSpell, secondCardData, {}, true, template);

    // Recursively check if the second card also overflows
    const testTemp = document.getElementById('reusable-unconstrained-temp');
    testTemp.innerHTML = secondCardHTML;

    const secondCardHeight = await new Promise(resolve => {
        requestAnimationFrame(() => {
            const height = testTemp.querySelector('.spell-card')?.offsetHeight || 0;
            resolve(height);
        });
    });

    if (secondCardHeight > targetHeightPx) {
        if (isDebugSpell) {
            console.log(`Second card overflows, recursively splitting...`);
        }
        const additionalCards = await splitCardContent(secondSpell, secondCardData, secondCardHTML, true, template);

        // Only add counters if this is the top-level call (cardNumber === 1)
        if (cardNumber === 1) {
            const total = 1 + (additionalCards.match(/class="spell-card"/g) || []).length;
            const firstCardWithCounter = firstCardHTML.replace(/(<div class="spell-footer".*?>)/, `$1<div class="card-counter">1/${total}</div>`);
            return firstCardWithCounter + additionalCards;
        }

        return additionalCards;
    }

    // If we're in a recursive call, we need to adjust the counters
    if (totalCards) {
        const firstCardWithCounter = firstCardHTML.replace(/(<div class="spell-footer".*?>)/, `$1<div class="card-counter">${cardNumber}/${totalCards}</div>`);
        const secondCardWithCounter = secondCardHTML.replace(/(<div class="spell-footer".*?>)/, `$1<div class="card-counter">${cardNumber + 1}/${totalCards}</div>`);
        return firstCardWithCounter + secondCardWithCounter;
    }

    // Top-level call: add counters to both cards
    const firstCardWithCounter = firstCardHTML.replace(/(<div class="spell-footer".*?>)/, `$1<div class="card-counter">1/2</div>`);
    const secondCardWithCounter = secondCardHTML.replace(/(<div class="spell-footer".*?>)/, `$1<div class="card-counter">2/2</div>`);

    return firstCardWithCounter + secondCardWithCounter;
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));