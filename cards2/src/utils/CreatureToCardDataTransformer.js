import { Creature } from './Creature.js';
import { CardData } from './CardData.js';

/**
 * Transformer utility to convert Creature objects to CardData objects
 */
export class CreatureToCardDataTransformer {
  /**
   * Transform a single Creature to CardData
   * @param {Creature} creature - The creature to transform
   * @returns {CardData} Transformed card data
   */
  static transform(creature) {
    if (!creature) {
      return new CardData();
    }
    
    const formattedCR = creature.getFormattedCR();
    
    // Create specs array with two rows for creature properties
    const specs = [
      // First row: AC, HP, SPEED
      [
        { label: 'AC', value: creature.armorClass },
        { label: 'HP', value: `${creature.hitPoints} (${creature.hitDice})` },
        { label: 'SPEED', value: creature.speed }
      ],
      // Second row: Ability modifiers (no scores)
      [
        { label: 'STR', value: creature.abilityModifiers.str },
        { label: 'DEX', value: creature.abilityModifiers.dex },
        { label: 'CON', value: creature.abilityModifiers.con },
        { label: 'INT', value: creature.abilityModifiers.int },
        { label: 'WIS', value: creature.abilityModifiers.wis },
        { label: 'CHA', value: creature.abilityModifiers.cha }
      ]
    ];
    
    // Build main body content (without ability scores)
    let body = '';
    
    // Add damage immunities/resistances if any
    if (creature.damageImmunities.length > 0) {
      body += `<p><strong>Damage Immunities:</strong> ${creature.damageImmunities.join(', ')}</p>`;
    }
    if (creature.damageResistances.length > 0) {
      body += `<p><strong>Damage Resistances:</strong> ${creature.damageResistances.join(', ')}</p>`;
    }
    if (creature.damageVulnerabilities.length > 0) {
      body += `<p><strong>Damage Vulnerabilities:</strong> ${creature.damageVulnerabilities.join(', ')}</p>`;
    }
    if (creature.conditionImmunities.length > 0) {
      const immunities = creature.conditionImmunities.map(imm => 
        typeof imm === 'object' ? imm.name : imm
      ).join(', ');
      body += `<p><strong>Condition Immunities:</strong> ${immunities}</p>`;
    }
    
    // Add senses
    if (creature.senses) {
      body += `<p><strong>Senses:</strong> ${creature.senses}</p>`;
    }
    
    // Add languages
    if (creature.languages) {
      body += `<p><strong>Languages:</strong> ${creature.languages}</p>`;
    }
    
    // Add proficiencies (saving throws and skills)
    if (creature.proficiencies.savingThrows.length > 0) {
      const saves = creature.proficiencies.savingThrows.map(s => `${s.ability.toUpperCase()} +${s.bonus}`).join(', ');
      body += `<p><strong>Saving Throws:</strong> ${saves}</p>`;
    }
    if (creature.proficiencies.skills.length > 0) {
      const skills = creature.proficiencies.skills.map(s => `${s.name} +${s.bonus}`).join(', ');
      body += `<p><strong>Skills:</strong> ${skills}</p>`;
    }
    
    // Add traits if any
    if (creature.traits.length > 0) {
      body += `<p class="section-header"><strong>Traits</strong></p>`;
      for (const trait of creature.traits) {
        if (trait.name && trait.desc) {
          const desc = Array.isArray(trait.desc) ? trait.desc.join(' ') : trait.desc;
          body += `<p><strong>${trait.name}.</strong> ${desc}</p>`;
        }
      }
    }
    
    // Add actions if any
    if (creature.actions.length > 0) {
      body += `<p class="section-header"><strong>Actions</strong></p>`;
      for (const action of creature.actions) {
        if (action.name && action.desc) {
          const desc = Array.isArray(action.desc) ? action.desc.join(' ') : action.desc;
          body += `<p><strong>${action.name}.</strong> ${desc}</p>`;
        }
      }
    }
    
    // Add reactions if any
    if (creature.reactions && creature.reactions.length > 0) {
      body += `<p class="section-header"><strong>Reactions</strong></p>`;
      for (const reaction of creature.reactions) {
        if (reaction.name && reaction.desc) {
          const desc = Array.isArray(reaction.desc) ? reaction.desc.join(' ') : reaction.desc;
          body += `<p><strong>${reaction.name}.</strong> ${desc}</p>`;
        }
      }
    }
    
    // Add legendary actions if any
    if (creature.legendaryActions.length > 0) {
      body += `<p class="section-header"><strong>Legendary Actions</strong></p>`;
      for (const legendaryAction of creature.legendaryActions) {
        if (legendaryAction.name && legendaryAction.desc) {
          const desc = Array.isArray(legendaryAction.desc) ? legendaryAction.desc.join(' ') : legendaryAction.desc;
          body += `<p><strong>${legendaryAction.name}.</strong> ${desc}</p>`;
        }
      }
    }
    
    return new CardData({
      title: creature.name,
      leftIndicator: '',
      rightIndicator: formattedCR,
      specs: specs,
      body: body,
      bottomLeft: creature.getSizeAndType(),
      bottomRight: creature.alignment
    });
  }
  
  /**
   * Transform an array of Creatures to CardData array
   * @param {Array<Creature>} creatures - Array of creatures to transform
   * @returns {Array<CardData>} Array of transformed card data
   */
  static transformArray(creatures) {
    if (!creatures || !Array.isArray(creatures)) {
      return [];
    }
    
    // Sort creatures by CR (numeric), then by name
    const sortedCreatures = [...creatures].sort((a, b) => {
      const crA = parseFloat(a.challengeRating);
      const crB = parseFloat(b.challengeRating);
      
      if (crA !== crB) {
        return crA - crB;
      }
      
      return a.name.localeCompare(b.name);
    });
    
    return sortedCreatures.map(creature => this.transform(creature));
  }
}

