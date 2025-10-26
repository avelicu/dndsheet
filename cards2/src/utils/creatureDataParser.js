import { Creature } from './Creature.js';

/**
 * JSON Parser Utility for D&D Creatures
 * Handles parsing and data extraction from the 5e-SRD-Monsters.json file
 */
export class CreatureDataParser {
  constructor() {
    this.creatures = [];
    this.types = new Set();
    this.sizes = new Set();
    this.challengeRatings = new Set();
  }

  /**
   * Parse JSON data into structured creature data
   * @param {Array} jsonData - Array of creature objects from 5e-SRD-Monsters.json
   * @returns {Object} Parsed data with creatures, types, sizes, and challenge ratings
   */
  parseJSON(jsonData) {
    try {
      this.creatures = [];
      this.types.clear();
      this.sizes.clear();
      this.challengeRatings.clear();

      // Process each creature
      jsonData.forEach((creatureData) => {
        if (creatureData.name) {
          const creature = new Creature(creatureData);
          this.creatures.push(creature);
          this.extractTypesSizesAndCR(creature);
        }
      });

      return {
        creatures: this.creatures,
        types: Array.from(this.types).sort(),
        sizes: Array.from(this.sizes).sort(),
        challengeRatings: Array.from(this.challengeRatings).sort((a, b) => a - b)
      };
    } catch (error) {
      console.error('Error parsing creature JSON:', error);
      throw new Error(`Failed to parse creature JSON data: ${error.message}`);
    }
  }

  /**
   * Extract unique types, sizes, and challenge ratings from creature data
   * @param {Creature} creature - Creature object
   */
  extractTypesSizesAndCR(creature) {
    // Add type
    if (creature.type) {
      this.types.add(creature.type);
    }
    
    // Add size
    if (creature.size) {
      this.sizes.add(creature.size);
    }
    
    // Add challenge rating
    if (creature.challengeRating) {
      this.challengeRatings.add(creature.challengeRating);
    }
  }

  /**
   * Filter creatures by challenge rating, type, and size
   * @param {string} cr - Challenge rating to filter by
   * @param {string} type - Creature type to filter by
   * @param {string} size - Creature size to filter by
   * @returns {Array<Creature>} Filtered creatures
   */
  filterCreatures(cr = null, type = null, size = null) {
    return this.creatures.filter(creature => {
      const matchesCR = !cr || creature.isChallengeRating(cr);
      const matchesType = !type || creature.isType(type);
      const matchesSize = !size || creature.isSize(size);
      return matchesCR && matchesType && matchesSize;
    });
  }

  /**
   * Get creature statistics
   * @returns {Object} Stats about the creatures
   */
  getStats() {
    return {
      totalCreatures: this.creatures.length,
      totalTypes: this.types.size,
      totalSizes: this.sizes.size,
      totalCRs: this.challengeRatings.size,
      creaturesByCR: this.getCreaturesByCR(),
      creaturesByType: this.getCreaturesByType(),
      creaturesBySize: this.getCreaturesBySize()
    };
  }

  getCreaturesByCR() {
    const grouped = {};
    this.creatures.forEach(creature => {
      const cr = creature.challengeRating;
      if (!grouped[cr]) {
        grouped[cr] = [];
      }
      grouped[cr].push(creature);
    });
    return grouped;
  }

  getCreaturesByType() {
    const grouped = {};
    this.creatures.forEach(creature => {
      const type = creature.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(creature);
    });
    return grouped;
  }

  getCreaturesBySize() {
    const grouped = {};
    this.creatures.forEach(creature => {
      const size = creature.size;
      if (!grouped[size]) {
        grouped[size] = [];
      }
      grouped[size].push(creature);
    });
    return grouped;
  }
}

/**
 * Load creature data from JSON file
 * @returns {Promise<Object>} Creature data and metadata
 */
export async function loadCreatureData() {
  try {
    const response = await fetch('./data/5e-SRD-Monsters.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch creature data: ${response.status} ${response.statusText}`);
    }
    const jsonData = await response.json();
    
    const parser = new CreatureDataParser();
    const data = parser.parseJSON(jsonData);

    console.log('Creature data loaded successfully:', data.creatures.length, 'creatures');
    return data;
  } catch (error) {
    console.error('Error loading creature data:', error);
    throw new Error(`Failed to load creature data: ${error.message}`);
  }
}

