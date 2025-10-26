/**
 * Creature data class representing a D&D creature/monster
 */
export class Creature {
  constructor(data) {
    this.name = data.name?.trim() || '';
    this.size = data.size || '';
    this.type = data.type || '';
    this.alignment = data.alignment || '';
    this.armorClass = this.parseAC(data.armor_class);
    this.hitPoints = data.hit_points || 0;
    this.hitDice = data.hit_dice || '';
    this.speed = this.parseSpeed(data.speed);
    
    // Ability scores
    this.strength = data.strength || 10;
    this.dexterity = data.dexterity || 10;
    this.constitution = data.constitution || 10;
    this.intelligence = data.intelligence || 10;
    this.wisdom = data.wisdom || 10;
    this.charisma = data.charisma || 10;
    
    // Calculate modifiers
    this.abilityModifiers = {
      str: this.calculateModifier(this.strength),
      dex: this.calculateModifier(this.dexterity),
      con: this.calculateModifier(this.constitution),
      int: this.calculateModifier(this.intelligence),
      wis: this.calculateModifier(this.wisdom),
      cha: this.calculateModifier(this.charisma)
    };
    
    this.challengeRating = this.parseChallengeRating(data.challenge_rating);
    
    // Immunities and resistances
    this.damageVulnerabilities = Array.isArray(data.damage_vulnerabilities) ? data.damage_vulnerabilities : [];
    this.damageResistances = Array.isArray(data.damage_resistances) ? data.damage_resistances : [];
    this.damageImmunities = Array.isArray(data.damage_immunities) ? data.damage_immunities : [];
    this.conditionImmunities = Array.isArray(data.condition_immunities) ? data.condition_immunities : [];
    
    // Senses, languages
    this.senses = this.parseSenses(data.senses);
    this.languages = data.languages || '';
    
    // Proficiencies (saving throws, skills)
    this.proficiencies = this.parseProficiencies(data.proficiencies || []);
    
    // Actions, traits (from special_abilities field), reactions, legendary actions
    this.actions = Array.isArray(data.actions) ? data.actions : [];
    // Handle both 'traits' and 'special_abilities' field names
    this.traits = Array.isArray(data.special_abilities) ? data.special_abilities : (Array.isArray(data.traits) ? data.traits : []);
    this.reactions = Array.isArray(data.reactions) ? data.reactions : [];
    this.legendaryActions = Array.isArray(data.legendary_actions) ? data.legendary_actions : [];
  }
  
  /**
   * Parse AC from array format or number
   * @param {Array|number} acData - AC in various formats
   * @returns {string} AC as string (e.g., "17")
   */
  parseAC(acData) {
    if (Array.isArray(acData) && acData.length > 0) {
      return acData[0].value?.toString() || acData[0].toString();
    }
    return acData?.toString() || '';
  }
  
  /**
   * Parse speed object into formatted string
   * @param {Object|string} speedData - Speed object or string
   * @returns {string} Formatted speed string
   */
  parseSpeed(speedData) {
    if (typeof speedData === 'string') {
      return speedData;
    }
    if (typeof speedData === 'object' && speedData !== null) {
      const speeds = [];
      if (speedData.walk) speeds.push(`walk ${speedData.walk}`);
      if (speedData.swim) speeds.push(`swim ${speedData.swim}`);
      if (speedData.fly) speeds.push(`fly ${speedData.fly}`);
      if (speedData.climb) speeds.push(`climb ${speedData.climb}`);
      if (speedData.burrow) speeds.push(`burrow ${speedData.burrow}`);
      return speeds.join(', ') || '';
    }
    return '';
  }
  
  /**
   * Parse senses from object or string
   * @param {Object|string} sensesData - Senses object or string
   * @returns {string} Formatted senses string
   */
  parseSenses(sensesData) {
    if (typeof sensesData === 'string') {
      return sensesData;
    }
    
    if (typeof sensesData === 'object' && sensesData !== null) {
      const senses = [];
      
      // Handle passive perception
      if (sensesData.passive_perception) {
        senses.push(`passive Perception ${sensesData.passive_perception}`);
      }
      
      // Handle other sense types
      const specialSenses = Object.keys(sensesData).filter(key => key !== 'passive_perception');
      for (const key of specialSenses) {
        const value = sensesData[key];
        if (value) {
          if (typeof value === 'string') {
            senses.push(`${key} ${value}`);
          } else {
            senses.push(`${key} ${value}`);
          }
        }
      }
      
      return senses.join(', ');
    }
    
    return '';
  }

  /**
   * Calculate ability modifier from score
   * @param {number} score - Ability score
   * @returns {string} Modifier with +/- prefix
   */
  calculateModifier(score) {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  
  /**
   * Parse challenge rating
   * @param {number|string} crData - Challenge rating
   * @returns {string} CR as string
   */
  parseChallengeRating(crData) {
    if (typeof crData === 'number') {
      return crData.toString();
    }
    return crData || '0';
  }
  
  /**
   * Parse proficiencies array
   * @param {Array} profData - Proficiencies array
   * @returns {Object} Parsed proficiencies with saves and skills
   */
  parseProficiencies(profData) {
    const proficiencies = {
      savingThrows: [],
      skills: []
    };
    
    for (const prof of profData) {
      if (prof.proficiency?.name) {
        const name = prof.proficiency.name;
        if (name.includes('Saving Throw')) {
          const ability = name.split(':')[1]?.trim().toLowerCase() || '';
          proficiencies.savingThrows.push({
            ability,
            bonus: prof.value || 0
          });
        } else if (!name.includes('Saving Throw')) {
          // Remove "Skill: " prefix if present
          const skillName = name.replace(/^Skill:\s*/i, '');
          proficiencies.skills.push({
            name: skillName,
            bonus: prof.value || 0
          });
        }
      }
    }
    
    return proficiencies;
  }
  
  /**
   * Check if creature matches a specific challenge rating
   * @param {number|string} cr - Challenge rating to check
   * @returns {boolean} True if creature matches the CR
   */
  isChallengeRating(cr) {
    return this.challengeRating === cr.toString();
  }
  
  /**
   * Check if creature is of a specific type
   * @param {string} type - Creature type to check
   * @returns {boolean} True if creature matches the type
   */
  isType(type) {
    return this.type.toLowerCase() === type.toLowerCase();
  }
  
  /**
   * Check if creature is a specific size
   * @param {string} size - Creature size to check
   * @returns {boolean} True if creature matches the size
   */
  isSize(size) {
    return this.size.toLowerCase() === size.toLowerCase();
  }
  
  /**
   * Get formatted size and type
   * @returns {string} Formatted string like "Large Beast"
   */
  getSizeAndType() {
    return `${this.size} ${this.type}`;
  }
  
  /**
   * Get formatted challenge rating with fraction characters
   * @returns {string} Formatted CR
   */
  getFormattedCR() {
    const cr = parseFloat(this.challengeRating);
    if (isNaN(cr)) return '0';
    
    // Handle integer values
    if (cr % 1 === 0) {
      if (cr === 0) return '0';
      if (cr >= 1 && cr <= 30) return cr.toString();
      return cr.toString();
    }
    
    // Handle fractional values
    if (cr === 0.125 || Math.abs(cr - 0.125) < 0.001) return '⅛';
    if (cr === 0.25 || Math.abs(cr - 0.25) < 0.001) return '¼';
    if (cr === 0.5 || Math.abs(cr - 0.5) < 0.001) return '½';
    if (cr === 0.75 || Math.abs(cr - 0.75) < 0.001) return '¾';
    
    return cr.toString();
  }
  
  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      name: this.name,
      size: this.size,
      type: this.type,
      alignment: this.alignment,
      armorClass: this.armorClass,
      hitPoints: this.hitPoints,
      speed: this.speed,
      challengeRating: this.challengeRating,
      abilityModifiers: this.abilityModifiers,
      damageVulnerabilities: this.damageVulnerabilities,
      damageResistances: this.damageResistances,
      damageImmunities: this.damageImmunities,
      conditionImmunities: this.conditionImmunities,
      senses: this.senses,
      languages: this.languages,
      proficiencies: this.proficiencies,
      actions: this.actions,
      traits: this.traits,
      reactions: this.reactions,
      legendaryActions: this.legendaryActions
    };
  }
}

