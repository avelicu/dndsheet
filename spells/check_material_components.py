#!/usr/bin/env python3
"""Check material components in parentheses"""

import json

with open('../cards2/public/data/Core.json', 'r', encoding='utf-8') as f:
    core = json.load(f)

spells_with_m = [s for s in core if any('M' in str(c) and '(' in str(c) for c in s.get('components', []))]

print(f'Found {len(spells_with_m)} spells with M(...) in components')
print('\nExamples:')
for spell in spells_with_m[:5]:
    print(f'\n{spell["name"]}:')
    print(f'  components: {spell["components"]}')
    print(f'  material: {spell.get("material", "N/A")}')

