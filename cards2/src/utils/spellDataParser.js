/**
 * CSV Parser Utility for D&D Spells
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
      const lines = csvText.trim().split('\n');
      const headers = this.parseLine(lines[0]);
      
      if (!this.validateHeaders(headers)) {
        throw new Error('Invalid CSV headers. Expected: level;name;school_of_magic;casting_time;range;components;material_component;duration;description;classes');
      }

      this.spells = [];
      this.classes.clear();
      this.levels.clear();

      // Parse each spell line
      for (let i = 1; i < lines.length; i++) {
        const spell = this.parseSpellLine(lines[i], headers);
        if (spell) {
          this.spells.push(spell);
          this.extractClassesAndLevels(spell);
        }
      }

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
   * Parse a single line from CSV
   * @param {string} line - CSV line
   * @returns {Array} Parsed fields
   */
  parseLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField.trim());
    return fields;
  }

  /**
   * Validate CSV headers
   * @param {Array} headers - Parsed headers
   * @returns {boolean} True if valid
   */
  validateHeaders(headers) {
    const expectedHeaders = [
      'level', 'name', 'school_of_magic', 'casting_time', 'range',
      'components', 'material_component', 'duration', 'description', 'classes'
    ];
    
    return headers.length === expectedHeaders.length &&
           headers.every((header, index) => header === expectedHeaders[index]);
  }

  /**
   * Parse a single spell line
   * @param {string} line - CSV line
   * @param {Array} headers - CSV headers
   * @returns {Object|null} Parsed spell object
   */
  parseSpellLine(line, headers) {
    try {
      const fields = this.parseLine(line);
      
      if (fields.length !== headers.length) {
        console.warn(`Skipping malformed line: ${line.substring(0, 50)}...`);
        return null;
      }

      const spell = {};
      headers.forEach((header, index) => {
        spell[header] = fields[index];
      });

      // Convert level to number
      spell.level = parseInt(spell.level, 10);
      
      // Parse classes string into array
      spell.classes = spell.classes
        .split(',')
        .map(cls => cls.trim())
        .filter(cls => cls.length > 0);

      return spell;
    } catch (error) {
      console.warn(`Error parsing spell line: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract unique classes and levels from spell data
   * @param {Object} spell - Spell object
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
   * @returns {Array} Filtered spells
   */
  filterSpells(className, level) {
    return this.spells.filter(spell => {
      const matchesClass = !className || spell.classes.includes(className);
      const matchesLevel = level === null || spell.level === level;
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
    const response = await fetch('/all_spells.csv');
    
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
