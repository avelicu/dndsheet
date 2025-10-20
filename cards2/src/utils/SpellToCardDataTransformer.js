import { Spell } from './Spell';
import { CardData } from './CardData';

/**
 * Transformer utility to convert Spell objects to CardData objects
 */
export class SpellToCardDataTransformer {
  /**
   * Transform a single Spell to CardData
   * @param {Spell} spell - The spell to transform
   * @returns {CardData} Transformed card data
   */
  static transform(spell) {
    if (!spell) {
      return new CardData();
    }

    // Process spell name for ritual detection
    const { formatted: title, isRitual } = this.processSpellName(spell.name);
    
    // Process duration for concentration detection
    const { formatted: duration, isConcentration } = this.processDuration(spell.duration);

    // Create specs array from spell properties
    const specs = [
      { label: 'RANGE', value: spell.range },
      { label: 'COMPONENTS', value: spell.components },
      { 
        label: 'DURATION', 
        value: duration,
        hasConcentration: isConcentration
      },
      { label: 'CASTING TIME', value: spell.castingTime }
    ];

    // Build main body content
    let body = '';
    if (spell.materialComponent) {
      body += `<em>Material Component:</em> ${spell.materialComponent}<br/><br/>`;
    }
    body += spell.description;

    return new CardData({
      title: title,
      leftIndicator: isRitual ? 'R' : '',
      rightIndicator: spell.level.toString(),
      specs: specs,
      body: body,
      bottomLeft: spell.schoolOfMagic,
      bottomRight: spell.classes.join(', ')
    });
  }

  /**
   * Transform an array of Spells to CardData array
   * @param {Array<Spell>} spells - Array of spells to transform
   * @returns {Array<CardData>} Array of transformed card data
   */
  static transformArray(spells) {
    if (!spells || !Array.isArray(spells)) {
      return [];
    }
    return spells.map(spell => this.transform(spell));
  }

  /**
   * Process spell name to detect and remove ritual tag
   * @param {string} name - Original spell name
   * @returns {Object} Object with formatted name and ritual flag
   */
  static processSpellName(name) {
    if (!name) return { formatted: '', isRitual: false };
    
    const isRitual = name.toLowerCase().includes('(ritual)');
    let formatted = name;
    
    if (isRitual) {
      formatted = formatted.replace(/\s*\(ritual\)/gi, '');
    }
    
    return { formatted, isRitual };
  }

  /**
   * Process duration to detect concentration and format text
   * @param {string} duration - Original duration text
   * @returns {Object} Object with formatted duration and concentration flag
   */
  static processDuration(duration) {
    if (!duration) return { formatted: '', isConcentration: false };
    
    const isConcentration = duration.toLowerCase().includes('concentration');
    let formatted = duration;
    
    if (isConcentration) {
      formatted = formatted.replace(/^Concentration,\s*/i, '');
    }
    // Replace "up to" with less-than-or-equal-to symbol
    formatted = formatted.replace(/up to/gi, '≤');
    
    return { formatted, isConcentration };
  }
}
