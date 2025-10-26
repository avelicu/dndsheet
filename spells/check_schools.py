#!/usr/bin/env python3
"""Check school values in CSV files"""

import csv

with open('Wizard.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    spells = list(reader)

print('Headers:', list(spells[0].keys()))
print('\nSample school values from Wizard.csv:')
for spell in spells[:15]:
    keys = list(spell.keys())
    name = spell[keys[1]] if len(keys) > 1 else 'N/A'
    school = spell[keys[2]] if len(keys) > 2 else 'N/A'
    print(f'{name}: "{school}"')

