/**
 * Spell data class representing a D&D spell
 */
export class Spell {
  constructor(data) {
    this.level = parseInt(data.level, 10);
    this.name = data.name?.trim() || '';
    this.schoolOfMagic = data.school_of_magic?.trim() || '';
    this.castingTime = data.casting_time?.trim() || '';
    this.range = data.range?.trim() || '';
    this.components = data.components?.trim() || '';
    this.materialComponent = data.material_component?.trim() || '';
    this.duration = data.duration?.trim() || '';
    this.description = data.description?.trim() || '';
    this.classes = this.parseClasses(data.classes);
  }

  /**
   * Parse classes string into array
   * @param {string} classesString - Comma-separated class names
   * @returns {Array<string>} Array of class names
   */
  parseClasses(classesString) {
    if (!classesString) return [];
    
    return classesString
      .split(',')
      .map(cls => cls.trim())
      .filter(cls => cls.length > 0);
  }

  /**
   * Check if this spell is available to a specific class
   * @param {string} className - Class name to check
   * @returns {boolean} True if spell is available to the class
   */
  isAvailableToClass(className) {
    return this.classes.includes(className);
  }

  /**
   * Check if this spell matches a specific level
   * @param {number} level - Spell level to check
   * @returns {boolean} True if spell matches the level
   */
  isLevel(level) {
    return this.level === level;
  }


  /**
   * Get formatted level display
   * @returns {string} Formatted level string
   */
  getFormattedLevel() {
    if (this.level === 0) return 'Cantrip';
    return `${this.level}${this.getOrdinalSuffix(this.level)} Level`;
  }

  /**
   * Get ordinal suffix for numbers
   * @param {number} num - Number to get suffix for
   * @returns {string} Ordinal suffix
   */
  getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  /**
   * Get spell summary for display
   * @returns {Object} Summary object with key spell info
   */
  getSummary() {
    return {
      name: this.name,
      level: this.level,
      formattedLevel: this.getFormattedLevel(),
      school: this.schoolOfMagic,
      classes: this.classes,
      castingTime: this.castingTime,
      range: this.range
    };
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      level: this.level,
      name: this.name,
      schoolOfMagic: this.schoolOfMagic,
      castingTime: this.castingTime,
      range: this.range,
      components: this.components,
      materialComponent: this.materialComponent,
      duration: this.duration,
      description: this.description,
      classes: this.classes
    };
  }

  /**
   * Create Spell instance from plain object
   * @param {Object} obj - Plain object
   * @returns {Spell} Spell instance
   */
  static fromObject(obj) {
    return new Spell({
      level: obj.level,
      name: obj.name,
      school_of_magic: obj.schoolOfMagic,
      casting_time: obj.castingTime,
      range: obj.range,
      components: obj.components,
      material_component: obj.materialComponent,
      duration: obj.duration,
      description: obj.description,
      classes: obj.classes?.join(', ') || ''
    });
  }
}
