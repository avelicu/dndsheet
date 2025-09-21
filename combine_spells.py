#!/usr/bin/env python3
"""
Script to combine all spell CSV files from different classes into one unified CSV.
Handles deduplication and warns about conflicts.
"""

import csv
import os
import sys
from collections import defaultdict

def extract_school(school_level):
    """Extract school of magic from school_level field."""
    if not school_level:
        return "Unknown"
    
    # List of known schools of magic
    schools = [
        'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 
        'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
    ]
    
    # Look for school names in the text
    for school in schools:
        if school.lower() in school_level.lower():
            return school
    
    # If no school found, return the first word (fallback)
    return school_level.split()[0] if school_level.split() else "Unknown"

def read_csv_file(filepath):
    """Read a CSV file and return the data as a list of dictionaries."""
    spells = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            # Use semicolon as delimiter based on the file structure
            reader = csv.reader(f, delimiter=';')
            rows = list(reader)
            
            if not rows:
                return spells
                
            # Define headers based on the actual structure
            headers = ['level', 'name', 'school_level', 'casting_time', 'range', 'components', 'duration', 'description', 'class']
            print(f"Processing {os.path.basename(filepath)} with headers: {headers}")
            
            # Process all rows (no header row to skip)
            for i, row in enumerate(rows):
                if len(row) != len(headers):
                    print(f"Warning: Row {i+1} in {os.path.basename(filepath)} has {len(row)} columns, expected {len(headers)}")
                    continue
                    
                spell_dict = {}
                for j, header in enumerate(headers):
                    spell_dict[header] = row[j].strip('"')  # Remove quotes
                
                # Extract material component from description using regex
                import re
                description = spell_dict['description']
                material_component = ""
                
                # Look for material component at the very beginning with regex
                match = re.match(r'^\(([^)]+)\)', description)
                if match:
                    material_component = match.group(1)
                    # Remove the material component from description
                    spell_dict['description'] = description[match.end():].strip()
                
                spell_dict['material_component'] = material_component
                
                # Extract school of magic from school_level field
                school_level = spell_dict['school_level']
                school_of_magic = extract_school(school_level)
                spell_dict['school_of_magic'] = school_of_magic
                
                spells.append(spell_dict)
                
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    return spells

def combine_spells():
    """Main function to combine all spell CSV files."""
    spells_dir = "spells"
    
    if not os.path.exists(spells_dir):
        print(f"Error: Directory '{spells_dir}' not found")
        return
    
    # Find all CSV files
    csv_files = [f for f in os.listdir(spells_dir) if f.endswith('.csv')]
    
    if not csv_files:
        print(f"No CSV files found in '{spells_dir}'")
        return
    
    print(f"Found {len(csv_files)} CSV files: {csv_files}")
    
    all_spells = []
    spell_dict = defaultdict(list)  # name -> list of spell entries
    
    # Read all CSV files
    for csv_file in sorted(csv_files):
        filepath = os.path.join(spells_dir, csv_file)
        class_name = csv_file.replace('.csv', '')
        print(f"\nProcessing {csv_file}...")
        
        spells = read_csv_file(filepath)
        print(f"Found {len(spells)} spells in {csv_file}")
        
        for spell in spells:
            # Add class information to the spell
            spell['source_class'] = class_name
            all_spells.append(spell)
            
            # Group by spell name for deduplication
            spell_name = spell.get('name', '').strip()
            if spell_name:
                spell_dict[spell_name].append(spell)
    
    print(f"\nTotal spells collected: {len(all_spells)}")
    print(f"Unique spell names: {len(spell_dict)}")
    
    # Check for conflicts and deduplicate
    conflicts = []
    deduplicated_spells = []
    
    for spell_name, spell_entries in spell_dict.items():
        if len(spell_entries) == 1:
            # No duplicates, just add it
            spell = spell_entries[0]
            # Combine classes into the last field (deduplicated)
            classes = list(set([entry['source_class'] for entry in spell_entries]))
            spell['classes'] = ', '.join(sorted(classes))
            deduplicated_spells.append(spell)
        else:
            # Check for conflicts
            base_spell = spell_entries[0]
            spell_conflicts = []
            
            for i, other_spell in enumerate(spell_entries[1:], 1):
                # Compare all fields except class, source_class, and classes (class is expected to differ)
                for key, value in base_spell.items():
                    if key not in ['source_class', 'classes', 'class'] and key in other_spell:
                        other_value = other_spell[key]
                        
                        # Special handling for description field - ignore small differences
                        if key == 'description':
                            # Calculate character difference
                            char_diff = abs(len(value) - len(other_value))
                            if char_diff < 5:
                                continue  # Ignore small differences in descriptions
                        
                        # Compare values ignoring case
                        if value.lower() != other_value.lower():
                            # Check if we already have a conflict for this field
                            existing_conflict = None
                            for conflict in spell_conflicts:
                                if conflict['field'] == key:
                                    existing_conflict = conflict
                                    break
                            
                            if existing_conflict:
                                # Add this class/value pair to existing conflict
                                existing_conflict['class_values'].append({
                                    'class': other_spell['source_class'],
                                    'value': other_value
                                })
                            else:
                                # Create new conflict
                                spell_conflicts.append({
                                    'spell_name': spell_name,
                                    'field': key,
                                    'class_values': [
                                        {'class': base_spell['source_class'], 'value': value},
                                        {'class': other_spell['source_class'], 'value': other_value}
                                    ]
                                })
            
            if spell_conflicts:
                conflicts.extend(spell_conflicts)
                print(f"CONFLICT WARNING: {spell_name} has different field values across classes!")
                for conflict in spell_conflicts:
                    print(f"  Field '{conflict['field']}' differs between:")
                    for class_value in conflict['class_values']:
                        print(f"    {class_value['class']}: {class_value['value']}")
            
            # Use the first entry as base and combine classes (deduplicated)
            classes = list(set([entry['source_class'] for entry in spell_entries]))
            base_spell['classes'] = ', '.join(sorted(classes))
            deduplicated_spells.append(base_spell)
    
    print(f"\nConflicts found: {len(conflicts)}")
    print(f"Deduplicated spells: {len(deduplicated_spells)}")
    
    # Sort spells by level (numeric), then by name (alphabetical)
    def sort_key(spell):
        level = int(spell['level']) if spell['level'].isdigit() else 0
        name = spell['name'].lower()
        return (level, name)
    
    deduplicated_spells.sort(key=sort_key)
    
    # Write the combined CSV
    if deduplicated_spells:
        output_file = "all_spells.csv"
        
        # Define specific field order (excluding 'class' and 'source_class')
        fieldnames = ['level', 'name', 'school_of_magic', 'casting_time', 'range', 'components', 'material_component', 'duration', 'description', 'classes']
        
        print(f"\nWriting combined CSV to {output_file}...")
        print(f"Headers: {fieldnames}")
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, delimiter=';', quoting=csv.QUOTE_MINIMAL)
            
            # Write headers
            writer.writerow(fieldnames)
            
            # Write spells
            for spell in deduplicated_spells:
                row = [spell.get(field, '') for field in fieldnames]
                writer.writerow(row)
        
        print(f"Successfully wrote {len(deduplicated_spells)} spells to {output_file}")
        
        # Show all conflicts if any
        if conflicts:
            print(f"\nAll conflicts found:")
            for i, conflict in enumerate(conflicts, 1):
                print(f"  {i}. {conflict['spell_name']}: {conflict['field']} differs between:")
                for class_value in conflict['class_values']:
                    print(f"     {class_value['class']}: {class_value['value']}")
    else:
        print("No spells to write!")

if __name__ == "__main__":
    combine_spells()
