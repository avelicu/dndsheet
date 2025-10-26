#!/usr/bin/env python3
"""
Verify that the transformations were applied correctly to the generated JSON files.
"""

import json

# Load the generated JSON files
with open('Core.json', 'r', encoding='utf-8') as f:
    core_spells = json.load(f)

with open('XanatharsGuide.json', 'r', encoding='utf-8') as f:
    xanathars_spells = json.load(f)

print("=== Verifying Transformations ===\n")

# Check Absorb Elements (reaction spell)
absorb = [s for s in core_spells if s['name'] == 'Absorb Elements']
if absorb:
    spell = absorb[0]
    print("1. Absorb Elements (Reaction spell):")
    print(f"   Casting Time: '{spell['casting_time']}'")
    print(f"   Description (first 150 chars): '{spell['description'][:150]}...'")
    print()

# Check Leomund's Tiny Hut (Self range)
tiny_hut = [s for s in core_spells if s['name'] == "Leomund's Tiny Hut"]
if tiny_hut:
    spell = tiny_hut[0]
    print("2. Leomund's Tiny Hut (Self range):")
    print(f"   Range: '{spell['range']}'")
    print()

# Check Arms of Hadar (Self range)
arms = [s for s in core_spells if s['name'] == 'Arms of Hadar']
if arms:
    spell = arms[0]
    print("3. Arms of Hadar (Self range):")
    print(f"   Range: '{spell['range']}'")
    print()

# Check Control Flames (Instantaneous or X duration)
control_flames = [s for s in xanathars_spells if s['name'] == 'Control Flames']
if control_flames:
    spell = control_flames[0]
    print("4. Control Flames (Duration with 'see below'):")
    print(f"   Duration: '{spell['duration']}'")
    print()

# Check Mold Earth (Instantaneous or X duration)
mold_earth = [s for s in xanathars_spells if s['name'] == 'Mold Earth']
if mold_earth:
    spell = mold_earth[0]
    print("5. Mold Earth (Duration with 'see below'):")
    print(f"   Duration: '{spell['duration']}'")
    print()

# Check Soul Cage (reaction spell) if it exists
soul_cage = [s for s in xanathars_spells if s['name'] == 'Soul Cage']
if soul_cage:
    spell = soul_cage[0]
    print("6. Soul Cage (Reaction spell):")
    print(f"   Casting Time: '{spell['casting_time']}'")
    print(f"   Description (first 150 chars): '{spell['description'][:150]}...'")
    print()

print("\n=== Verification Complete ===")

