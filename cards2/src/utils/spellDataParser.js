import Papa from 'papaparse';
import { Spell } from './Spell.js';

/**
 * CSV Parser Utility for D&D Spells using PapaParse
 * Handles parsing and data extraction from the spells CSV file
 */
export class SpellDataParser {
  constructor() {
    this.spells = [];
    this.classes = new Set();
    this.levels = new Set();
  }

  /**
   * Parse CSV text into structured spell data
   * @param {string} csvText - Raw CSV content
   * @returns {Object} Parsed data with spells, classes, and levels
   */
  parseCSV(csvText) {
    try {
      const result = Papa.parse(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim()
      });

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }

      this.spells = [];
      this.classes.clear();
      this.levels.clear();

      // Process each spell
      result.data.forEach((spellData) => {
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
      console.error('Error parsing CSV:', error);
      throw new Error(`Failed to parse CSV data: ${error.message}`);
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
 * Fetch and parse spell data from CSV file
 * @returns {Promise<Object>} Parsed spell data
 */
export async function loadSpellData() {
  try {
    const response = await fetch('./all_spells.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const parser = new SpellDataParser();
    const data = parser.parseCSV(csvText);
    
    console.log('Spell data loaded successfully:', data.spells.length, 'spells');
    return data;
  } catch (error) {
    console.error('Error loading spell data:', error);
    throw new Error(`Failed to load spell data: ${error.message}`);
  }
}
