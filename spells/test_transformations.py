#!/usr/bin/env python3
"""
Test the transformation functions before running the full conversion.
"""

import re

def transform_range(range_text):
    """Transform range field: if 'Self (something)', extract just 'something'. 
    Also remove 'hemisphere' suffix from radius descriptions."""
    if not range_text:
        return range_text
    
    # Match "Self (something)" pattern
    match = re.match(r'^Self\s*\(([^)]+)\)$', range_text.strip(), re.IGNORECASE)
    if match:
        range_text = match.group(1)
    
    # Remove "hemisphere" suffix from radius descriptions
    # e.g., "10-foot-radius hemisphere" -> "10-foot radius"
    range_text = re.sub(r'-radius\s+hemisphere$', ' radius', range_text, flags=re.IGNORECASE)
    
    return range_text

def transform_duration(duration_text):
    """Transform duration field: if 'Instantaneous or X (see below)', extract 'X*'."""
    if not duration_text:
        return duration_text
    
    # Match "Instantaneous or X (see below)" pattern
    match = re.match(r'^Instantaneous\s+or\s+([^(]+)\s*\(see below\)$', duration_text.strip(), re.IGNORECASE)
    if match:
        return match.group(1).strip() + '*'
    
    return duration_text

def transform_casting_time_and_description(casting_time, description):
    """
    Transform casting time and description for special reaction spells.
    If casting time is '1 reaction, which you take ...', 
    set casting time to '1 reaction*' and prepend 'Reaction, ...' to description.
    Returns (transformed_casting_time, transformed_description)
    """
    if not casting_time:
        return casting_time, description
    
    # Match "1 reaction, which you take ..." pattern
    match = re.match(r'^1\s+reaction,\s+which you take\s+(.+)$', casting_time.strip(), re.IGNORECASE)
    if match:
        reaction_condition = match.group(1)
        new_casting_time = '1 reaction*'
        new_description = f'Reaction, {reaction_condition}\n\n{description}' if description else f'Reaction, {reaction_condition}'
        return new_casting_time, new_description
    
    return casting_time, description

# Test cases
print("=== Testing Range Transformations ===\n")

test_ranges = [
    "Self (10-foot radius)",
    "Self (30-foot radius)",
    "Self (10-foot-radius hemisphere)",
    "60 feet",
    "Touch",
    "Self"
]

for test_range in test_ranges:
    result = transform_range(test_range)
    print(f"Input:  '{test_range}'")
    print(f"Output: '{result}'")
    print()

print("\n=== Testing Duration Transformations ===\n")

test_durations = [
    "Instantaneous or 1 hour (see below)",
    "Concentration, up to 10 minutes",
    "1 minute",
    "Instantaneous"
]

for test_duration in test_durations:
    result = transform_duration(test_duration)
    print(f"Input:  '{test_duration}'")
    print(f"Output: '{result}'")
    print()

print("\n=== Testing Casting Time & Description Transformations ===\n")

test_cases = [
    (
        "1 reaction, which you take when you take acid, cold, fire, lightning, or thunder damage",
        "You have resistance to the triggering damage type until the start of your next turn."
    ),
    (
        "1 reaction, which you take when a humanoid you can see within 60 feet of you dies",
        "This spell snatches the soul of a humanoid as it dies."
    ),
    (
        "1 action",
        "A normal spell description."
    )
]

for casting_time, description in test_cases:
    new_casting_time, new_description = transform_casting_time_and_description(casting_time, description)
    print(f"Input Casting Time:  '{casting_time}'")
    print(f"Output Casting Time: '{new_casting_time}'")
    print(f"Input Description:   '{description}'")
    print(f"Output Description:  '{new_description}'")
    print()

print("\n=== All tests completed ===")

