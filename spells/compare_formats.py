#!/usr/bin/env python3
"""
Script to compare CSV and JSON spell data formats to see what information is available.
"""

import json
import csv
import re
from pathlib import Path

def analyze_csv_structure(csv_file):
    """Analyze the structure of a CSV file."""
    print(f"\n=== Analyzing {csv_file.name} ===")
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            
            # Read first few rows to understand structure
            rows = []
            for i, row in enumerate(reader):
                if i >= 5:  # Only read first 5 rows for analysis
                    break
                rows.append(row)
            
            if rows:
                print(f"CSV Structure (first {len(rows)} rows):")
                for i, row in enumerate(rows):
                    print(f"Row {i+1}: {len(row)} columns")
                    for j, col in enumerate(row):
                        print(f"  Col {j+1}: {col[:50]}{'...' if len(col) > 50 else ''}")
                
                # Analyze what information we can extract
                print(f"\nAvailable information from CSV:")
                print(f"- Level: Column 1 (e.g., '{rows[0][0] if len(rows[0]) > 0 else 'N/A'}')")
                print(f"- Name: Column 2 (e.g., '{rows[0][1] if len(rows[0]) > 1 else 'N/A'}')")
                print(f"- School: Column 3 (e.g., '{rows[0][2] if len(rows[0]) > 2 else 'N/A'}')")
                print(f"- Casting Time: Column 4 (e.g., '{rows[0][3] if len(rows[0]) > 3 else 'N/A'}')")
                print(f"- Range: Column 5 (e.g., '{rows[0][4] if len(rows[0]) > 4 else 'N/A'}')")
                print(f"- Components: Column 6 (e.g., '{rows[0][5] if len(rows[0]) > 5 else 'N/A'}')")
                print(f"- Duration: Column 7 (e.g., '{rows[0][6] if len(rows[0]) > 6 else 'N/A'}')")
                print(f"- Description: Column 8 (e.g., '{rows[0][7][:50] if len(rows[0]) > 7 else 'N/A'}...')")
                print(f"- Classes: Column 9 (e.g., '{rows[0][8] if len(rows[0]) > 8 else 'N/A'}')")
                
                # Check for ritual tags
                ritual_count = 0
                for row in rows:
                    if len(row) > 1 and '(ritual)' in row[1].lower():
                        ritual_count += 1
                print(f"- Ritual detection: Found {ritual_count} spells with '(ritual)' in name")
                
                # Check for material components in description
                material_count = 0
                for row in rows:
                    if len(row) > 7 and '(' in row[7] and ')' in row[7]:
                        material_count += 1
                print(f"- Material components: Found {material_count} spells with parentheses in description")
                
    except Exception as e:
        print(f"Error analyzing {csv_file}: {e}")

def analyze_json_structure(json_file):
    """Analyze the structure of the JSON file."""
    print(f"\n=== Analyzing {json_file.name} ===")
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            spells_data = json.load(f)
        
        if spells_data and len(spells_data) > 0:
            sample_spell = spells_data[0]
            print(f"JSON Structure (sample spell):")
            print(f"Available fields:")
            for key, value in sample_spell.items():
                if isinstance(value, list):
                    print(f"- {key}: Array with {len(value)} items (e.g., {value[0][:50] if value else 'empty'}...)")
                elif isinstance(value, dict):
                    print(f"- {key}: Object with keys {list(value.keys())}")
                else:
                    print(f"- {key}: {type(value).__name__} (e.g., '{str(value)[:50]}{'...' if len(str(value)) > 50 else ''}')")
            
            # Count ritual spells
            ritual_count = sum(1 for spell in spells_data if spell.get('ritual', False))
            print(f"\nRitual spells: {ritual_count}")
            
            # Count spells with material components
            material_count = sum(1 for spell in spells_data if spell.get('material'))
            print(f"Spells with material components: {material_count}")
            
            # Count spells with concentration
            concentration_count = sum(1 for spell in spells_data if spell.get('concentration', False))
            print(f"Concentration spells: {concentration_count}")
            
    except Exception as e:
        print(f"Error analyzing {json_file}: {e}")

def main():
    """Main function to compare formats."""
    spells_dir = Path(__file__).parent
    
    # Analyze JSON structure
    json_file = spells_dir / "5e-SRD-Spells.json"
    analyze_json_structure(json_file)
    
    # Analyze CSV structure (use a few different files)
    csv_files = [
        spells_dir / "Wizard.csv",
        spells_dir / "Cleric.csv", 
        spells_dir / "Sorcerer.csv"
    ]
    
    for csv_file in csv_files:
        if csv_file.exists():
            analyze_csv_structure(csv_file)
    
    print(f"\n=== COMPARISON SUMMARY ===")
    print(f"JSON provides:")
    print(f"- Explicit ritual flag (boolean)")
    print(f"- Explicit concentration flag (boolean)")
    print(f"- Separate material component field")
    print(f"- Structured components array")
    print(f"- Higher level descriptions")
    print(f"- Attack type information")
    print(f"- Damage type and dice information")
    print(f"- Subclasses information")
    
    print(f"\nCSV provides:")
    print(f"- Ritual detection via '(ritual)' in name")
    print(f"- Concentration detection via 'Concentration' in duration")
    print(f"- Material components embedded in description")
    print(f"- Components as comma-separated string")
    print(f"- Source book information in class field (e.g., 'Wizard (TCE)')")
    print(f"- All information in flat structure")

if __name__ == "__main__":
    main()
