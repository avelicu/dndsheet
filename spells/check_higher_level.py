#!/usr/bin/env python3
"""Check higher_level field structure"""

import json

with open('../cards2/public/data/5e-SRD-Spells.json', 'r', encoding='utf-8') as f:
    srd = json.load(f)

spell_with_higher = [s for s in srd if 'higher_level' in s and s['higher_level']][0]

print('Spell with higher_level:')
print(f'Name: {spell_with_higher["name"]}')
print(f'higher_level type: {type(spell_with_higher["higher_level"])}')
print(f'higher_level: {spell_with_higher["higher_level"]}')

