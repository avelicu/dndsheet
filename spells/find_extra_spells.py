#!/usr/bin/env python3
"""
Script to find spells that are in CSV files but not in the SRD JSON.
Handles ritual tags properly by removing them from spell names for comparison.
"""

import json
import csv
import os
import re
from pathlib import Path

def clean_spell_name(name):
    """
    Clean spell name by removing ritual tags and extra whitespace.
    Handles both (ritual) and (Ritual) variations.
    """
    if not name:
        return ""
    
    # Remove ritual tags - case insensitive
    cleaned = re.sub(r'\s*\(ritual\)\s*', '', name, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    cleaned = cleaned.strip()
    
    return cleaned

def load_srd_spells(json_file):
    """Load spell names from SRD JSON file."""
    srd_spells = set()
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            spells_data = json.load(f)
        
        for spell in spells_data:
            if 'name' in spell:
                srd_spells.add(spell['name'].strip())
        
        print(f"Loaded {len(srd_spells)} spells from SRD JSON")
        return srd_spells
    
    except Exception as e:
        print(f"Error loading SRD JSON: {e}")
        return set()

def load_csv_spells(csv_file):
    """Load spell names from a CSV file."""
    csv_spells = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            # Use semicolon as delimiter based on the CSV format
            reader = csv.reader(f, delimiter=';')
            
            for row_num, row in enumerate(reader, 1):
                if len(row) >= 2:  # Ensure we have at least level and name
                    spell_name = row[1].strip('"')  # Remove quotes
                    csv_spells.append({
                        'name': spell_name,
                        'cleaned_name': clean_spell_name(spell_name),
                        'file': csv_file,
                        'row': row_num
                    })
        
        print(f"Loaded {len(csv_spells)} spells from {csv_file}")
        return csv_spells
    
    except Exception as e:
        print(f"Error loading CSV {csv_file}: {e}")
        return []

def main():
    """Main function to find extra spells."""
    spells_dir = Path(__file__).parent
    srd_json_file = spells_dir / "5e-SRD-Spells.json"
    
    # Load SRD spells
    srd_spells = load_srd_spells(srd_json_file)
    if not srd_spells:
        print("Failed to load SRD spells. Exiting.")
        return
    
    # Find all CSV files in the spells directory
    csv_files = list(spells_dir.glob("*.csv"))
    
    if not csv_files:
        print("No CSV files found in spells directory.")
        return
    
    print(f"\nFound {len(csv_files)} CSV files to process:")
    for csv_file in csv_files:
        print(f"  - {csv_file.name}")
    
    # Process each CSV file
    all_extra_spells = []
    
    for csv_file in csv_files:
        print(f"\n--- Processing {csv_file.name} ---")
        csv_spells = load_csv_spells(csv_file)
        
        # Find spells in CSV that are not in SRD
        extra_spells = []
        for spell in csv_spells:
            if spell['cleaned_name'] not in srd_spells:
                extra_spells.append(spell)
        
        print(f"Found {len(extra_spells)} extra spells in {csv_file.name}:")
        for spell in extra_spells:
            print(f"  - {spell['name']} (row {spell['row']})")
        
        all_extra_spells.extend(extra_spells)
    
    # Summary
    print(f"\n=== SUMMARY ===")
    print(f"Total extra spells found: {len(all_extra_spells)}")
    
    if all_extra_spells:
        print("\nAll extra spells by file:")
        for csv_file in csv_files:
            file_extras = [s for s in all_extra_spells if s['file'] == str(csv_file)]
            if file_extras:
                print(f"\n{csv_file.name} ({len(file_extras)} spells):")
                for spell in file_extras:
                    print(f"  - {spell['name']}")
    else:
        print("No extra spells found! All CSV spells are in the SRD JSON.")

if __name__ == "__main__":
    main()
