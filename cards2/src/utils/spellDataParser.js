import { Spell } from './Spell.js';

/**
 * JSON Parser Utility for D&D Spells
 * Handles parsing and data extraction from the 5e-SRD-Spells.json file
 */
export class SpellDataParser {
  constructor() {
    this.spells = [];
    this.classes = new Set();
    this.levels = new Set();
  }

  /**
   * Parse JSON data into structured spell data
   * @param {Array} jsonData - Array of spell objects from 5e-SRD-Spells.json
   * @returns {Object} Parsed data with spells, classes, and levels
   */
  parseJSON(jsonData) {
    try {
      this.spells = [];
      this.classes.clear();
      this.levels.clear();

      // Process each spell
      jsonData.forEach((spellData) => {
        if (spellData.name && spellData.level !== undefined) {
          const spell = new Spell(spellData);
          this.spells.push(spell);
          this.extractClassesAndLevels(spell);
        }
      });

      return {
        spells: this.spells,
        classes: Array.from(this.classes).sort(),
        levels: Array.from(this.levels).sort((a, b) => a - b)
      };
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error(`Failed to parse JSON data: ${error.message}`);
    }
  }

  /**
   * Extract unique classes and levels from spell data
   * @param {Spell} spell - Spell object
   */
  extractClassesAndLevels(spell) {
    // Add level
    this.levels.add(spell.level);
    
    // Add classes
    spell.classes.forEach(cls => this.classes.add(cls));
  }

  /**
   * Filter spells by class and level
   * @param {string} className - Class name to filter by
   * @param {number} level - Spell level to filter by
   * @returns {Array<Spell>} Filtered spells
   */
  filterSpells(className, level) {
    return this.spells.filter(spell => {
      const matchesClass = !className || spell.isAvailableToClass(className);
      const matchesLevel = level === null || spell.isLevel(level);
      return matchesClass && matchesLevel;
    });
  }

  /**
   * Get spell statistics
   * @returns {Object} Statistics about the spell data
   */
  getStats() {
    return {
      totalSpells: this.spells.length,
      totalClasses: this.classes.size,
      totalLevels: this.levels.size,
      spellsByLevel: this.getSpellsByLevel(),
      spellsByClass: this.getSpellsByClass()
    };
  }

  /**
   * Get spells grouped by level
   * @returns {Object} Spells grouped by level
   */
  getSpellsByLevel() {
    const grouped = {};
    this.spells.forEach(spell => {
      if (!grouped[spell.level]) {
        grouped[spell.level] = [];
      }
      grouped[spell.level].push(spell);
    });
    return grouped;
  }

  /**
   * Get spells grouped by class
   * @returns {Object} Spells grouped by class
   */
  getSpellsByClass() {
    const grouped = {};
    this.spells.forEach(spell => {
      spell.classes.forEach(cls => {
        if (!grouped[cls]) {
          grouped[cls] = [];
        }
        grouped[cls].push(spell);
      });
    });
    return grouped;
  }
}

/**
 * Fetch spell sources configuration
 * @returns {Promise<Object>} Spell sources configuration
 */
export async function loadSpellSources() {
  try {
    const response = await fetch('./spells.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spells.json: ${response.status} ${response.statusText}`);
    }
    
    const sourcesConfig = await response.json();
    console.log('Spell sources loaded:', sourcesConfig.sources.length, 'sources');
    return sourcesConfig;
  } catch (error) {
    console.error('Error loading spell sources:', error);
    throw new Error(`Failed to load spell sources: ${error.message}`);
  }
}

/**
 * Load spell data from a specific source file
 * @param {string} filePath - Path to the spell data file
 * @returns {Promise<Array>} Array of spell objects
 */
async function loadSpellDataFromFile(filePath) {
  try {
    const response = await fetch(`./${filePath}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error(`Error loading spell data from ${filePath}:`, error);
    throw new Error(`Failed to load spell data from ${filePath}: ${error.message}`);
  }
}

/**
 * Fetch and parse spell data from multiple sources
 * @param {Array<string>} enabledSources - Array of source IDs to load
 * @returns {Promise<Object>} Parsed spell data
 */
export async function loadSpellData(enabledSources = null) {
  try {
    // Load sources configuration
    const sourcesConfig = await loadSpellSources();
    
    // Determine which sources to load
    let sourcesToLoad = sourcesConfig.sources;
    if (enabledSources) {
      sourcesToLoad = sourcesConfig.sources.filter(source => enabledSources.includes(source.id));
    } else {
      // Load default sources if none specified
      sourcesToLoad = sourcesConfig.sources.filter(source => source.default);
    }
    
    console.log('Loading spell data from sources:', sourcesToLoad.map(s => s.name));
    
    // Load data from all enabled sources
    const allSpells = [];
    for (const source of sourcesToLoad) {
      try {
        const spells = await loadSpellDataFromFile(source.file);
        console.log(`Loaded ${spells.length} spells from ${source.name}`);
        allSpells.push(...spells);
      } catch (error) {
        console.warn(`Failed to load ${source.name}:`, error.message);
        // Continue loading other sources even if one fails
      }
    }
    
    // Parse combined spell data
    const parser = new SpellDataParser();
    const data = parser.parseJSON(allSpells);
    
    console.log('Total spell data loaded successfully:', data.spells.length, 'spells');
    return {
      ...data,
      sources: sourcesToLoad.map(s => ({ id: s.id, name: s.name }))
    };
  } catch (error) {
    console.error('Error loading spell data:', error);
    throw new Error(`Failed to load spell data: ${error.message}`);
  }
}
