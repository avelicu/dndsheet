#!/usr/bin/env python3
"""Verify material component extraction"""

import json

with open('Core.json', 'r', encoding='utf-8') as f:
    core = json.load(f)

# Check a few spells that should have material components
test_spells = ["Nathair's Mischief", "Rime's Binding Ice", "Draconic Transformation"]

for spell_name in test_spells:
    spell = [s for s in core if s['name'] == spell_name]
    if spell:
        spell = spell[0]
        print(f"\n{spell['name']}:")
        print(f"  components: {spell.get('components', 'N/A')}")
        print(f"  material: {spell.get('material', 'N/A')}")
    else:
        print(f"\n{spell_name}: NOT FOUND")

