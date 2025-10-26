#!/usr/bin/env python3
"""Find spells with problematic school field formats"""

import csv
import re
from pathlib import Path

spells_dir = Path(__file__).parent
csv_files = list(spells_dir.glob('*.csv'))

all_problematic = []

for csv_file in csv_files:
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        rows = list(reader)
        
        for row in rows:
            if len(row) >= 3:
                name = row[1]
                school_field = row[2]
                
                # Check if it matches expected patterns
                is_cantrip = bool(re.search(r'cantrip', school_field, re.I))
                is_leveled = bool(re.search(r'\d+(st|nd|rd|th)\s+level\s+\w+', school_field, re.I))
                
                if school_field and not (is_cantrip or is_leveled):
                    all_problematic.append((csv_file.name, name, school_field))

print(f'Found {len(all_problematic)} spells with problematic school fields:\n')
for filename, name, school in all_problematic[:20]:
    print(f'{filename} - {name}: "{school}"')

if len(all_problematic) > 20:
    print(f'\n... and {len(all_problematic) - 20} more')

