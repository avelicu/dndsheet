#!/usr/bin/env python3
"""Test the updated school regex pattern"""

import re

test_cases = [
    '1st level Abjuration',
    '1st-level abjuration', 
    '3rd-level necromancy',
    'Conjuration cantrip',
    '2nd level Evocation'
]

pattern = r'\d+(st|nd|rd|th)[-\s]+level\s+(\w+)'

print('Testing updated regex pattern:\n')
for tc in test_cases:
    match = re.search(pattern, tc, re.I)
    if match:
        school = match.group(2).title()
        print(f'"{tc}" -> "{school}"')
    else:
        print(f'"{tc}" -> NO MATCH')

