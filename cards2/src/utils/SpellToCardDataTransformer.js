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

    // Use ritual and concentration flags from JSON data
    const isRitual = spell.isRitualSpell();
    const isConcentration = spell.requiresConcentration();
    
    // Process spell name for ritual detection (for backward compatibility with CSV data)
    const { formatted: title } = this.processSpellName(spell.name);
    
    // Process duration for concentration detection (for backward compatibility with CSV data)
    const { formatted: duration } = this.processDuration(spell.duration);

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

    // Apply formatting rules to body
    body = this.formatDescription(body);

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

  /** Inline color palette for damage types */
  static DAMAGE_COLORS = {
    acid: '#7cb342',
    cold: '#29b6f6',
    fire: '#e53935',
    force: '#7e57c2',
    lightning: '#f9a825',
    necrotic: '#616161',
    poison: '#2e7d32',
    psychic: '#8e24aa',
    radiant: '#ffd54f',
    thunder: '#1e88e5',
    bludgeoning: '#6d4c41',
    piercing: '#455a64',
    slashing: '#37474f'
  };

  static colorDamage(typeWord) {
    const key = (typeWord || '').toLowerCase();
    const color = this.DAMAGE_COLORS[key] || '#000';
    return `<span style=\"color:${color}\">${typeWord}</span>`;
  }

  /**
   * Convert markdown to HTML
   * @param {string} markdown - Markdown text
   * @returns {string} HTML text
   */
  static markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Convert markdown bold italic ***text*** to <strong><em>text</em></strong>
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Convert markdown bold **text** to <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown italic *text* to <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert markdown code `text` to <code>text</code>
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert markdown line breaks (double newline) to <br/><br/>
    html = html.replace(/\n\n/g, '<br/><br/>');
    
    // Convert single newlines to <br/>
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  }

  /**
   * Format spell description: convert markdown to HTML, then apply D&D-specific formatting
   * @param {string} text - Raw text (may contain markdown)
   * @returns {string} Formatted HTML
   */
  static formatDescription(text) {
    if (!text) return '';

    // First convert markdown to HTML
    let html = this.markdownToHtml(text);
    
    // Then apply D&D-specific formatting
    let out = html;

    const damageTypes = '(acid|cold|fire|force|lightning|necrotic|poison|psychic|radiant|thunder|piercing|slashing|bludgeoning)';
    const dicePattern = '(?:\\d+\\s*)?\\d+d\\d+(?:\\s*[+\\-]\\s*\\d+)?';

    // Phase A: replace dice+damage phrases with placeholders to avoid double-bolding later
    const placeholders = [];
    let phIndex = 0;
    const diceDamageRegex = new RegExp(`\\b(${dicePattern})\\s+${damageTypes}\\s+damage\\b`, 'gi');
    out = out.replace(diceDamageRegex, (m, dice, dtype) => {
      const key = (dtype || '').toLowerCase();
      const color = SpellToCardDataTransformer.DAMAGE_COLORS[key] || '#000';
      const htmlFrag = `<strong><span style=\"color:${color}\">${dice} ${dtype} damage</span></strong>`;
      const token = `__DICEDMG_${phIndex++}__`;
      placeholders.push(htmlFrag);
      return token;
    });

    // Phase B: color standalone "<type> damage" occurrences (without dice), and bold them
    const typeDamageRegex = new RegExp(`\\b(${damageTypes})\\s+damage\\b`, 'gi');
    out = out.replace(typeDamageRegex, (m, dtype) => {
      const key = (dtype || '').toLowerCase();
      const color = SpellToCardDataTransformer.DAMAGE_COLORS[key] || '#000';
      return `<strong><span style=\"color:${color}\">${dtype} damage</span></strong>`;
    });

    // Phase B.1: color and bold standalone damage type words (not already colored)
    // Use a negative lookbehind to avoid matching types already in <span> tags
    const standaloneTypeRegex = new RegExp(`(?<!<span[^>]*>)\\b(${damageTypes})\\b(?![^<]*</span>)`, 'gi');
    out = out.replace(standaloneTypeRegex, (m, dtype) => {
      const key = (dtype || '').toLowerCase();
      const color = SpellToCardDataTransformer.DAMAGE_COLORS[key] || '#000';
      return `<strong><span style=\"color:${color}\">${dtype}</span></strong>`;
    });

    // Phase C: bold saves (e.g., "Dexterity saving throw", "Dex save")
    const saveRegex = /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\s+(saving throw|save)\b/gi;
    out = out.replace(saveRegex, (m) => `<strong>${m}</strong>`);

    // Phase C.1: bold spell attack phrases
    const spellAttackRegex = /\b(melee|ranged)\s+spell\s+attack\b/gi;
    out = out.replace(spellAttackRegex, (m) => `<strong>${m}</strong>`);

    // Phase D: bold any remaining dice specs (not part of a dice+damage phrase)
    const loneDiceRegex = new RegExp(`\\b${dicePattern}\\b`, 'gi');
    out = out.replace(loneDiceRegex, (m) => `<strong>${m}</strong>`);

    // Phase E: restore placeholders
    if (placeholders.length > 0) {
      out = out.replace(/__DICEDMG_(\d+)__/g, (m, i) => placeholders[Number(i)] || m);
    }

    return out;
  }
}
