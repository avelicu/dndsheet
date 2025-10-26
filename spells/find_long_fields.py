#!/usr/bin/env python3
"""
Find spells with long Duration, Range, or Casting Time fields
that might not fit in the card layout.
"""

import json
import os

# Load all spell files (including SRD for comparison)
spell_files = []
data_dir = '../cards2/public/data'
for filename in os.listdir(data_dir):
    if filename.endswith('.json'):
        spell_files.append(os.path.join(data_dir, filename))

# Track spells with long fields
long_fields = []

for filepath in spell_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        spells = json.load(f)
    
    source_name = os.path.basename(filepath)
    
    for spell in spells:
        name = spell.get('name', 'Unknown')
        duration = spell.get('duration', '')
        range_val = spell.get('range', '')
        casting_time = spell.get('casting_time', '')
        
        # Simulate UI abbreviations
        def get_ui_length(text):
            """Calculate the effective length after UI abbreviations"""
            text = str(text)
            # "Concentration" -> "C" (saves 12 chars)
            text = text.replace('Concentration', 'C')
            # "up to" -> "↑" (saves 4 chars)
            text = text.replace('up to', '↑')
            return len(text)
        
        # Check for long text after abbreviations
        issues = []
        duration_ui_len = get_ui_length(duration)
        range_ui_len = get_ui_length(range_val)
        casting_time_ui_len = get_ui_length(casting_time)
        
        if duration_ui_len > 20:
            issues.append(f'Duration ({len(str(duration))} chars -> {duration_ui_len} UI chars): {duration}')
        if range_ui_len > 20:
            issues.append(f'Range ({len(str(range_val))} chars -> {range_ui_len} UI chars): {range_val}')
        if casting_time_ui_len > 25:
            issues.append(f'Casting Time ({len(str(casting_time))} chars -> {casting_time_ui_len} UI chars): {casting_time}')
        
        if issues:
            long_fields.append({
                'source': source_name,
                'name': name,
                'issues': issues
            })

# Sort by source and print
long_fields.sort(key=lambda x: (x['source'], x['name']))

print(f'Found {len(long_fields)} spells with potentially long fields:\n')
for item in long_fields:
    print(f'{item["source"]} - {item["name"]}:')
    for issue in item['issues']:
        print(f'  {issue}')
    print()

# Also print summary statistics
print('\n=== SUMMARY ===')
print(f'Total spells with long fields: {len(long_fields)}')
by_source = {}
for item in long_fields:
    source = item['source']
    by_source[source] = by_source.get(source, 0) + 1

print('\nBy source:')
for source, count in sorted(by_source.items()):
    print(f'  {source}: {count}')

