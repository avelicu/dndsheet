#!/usr/bin/env python3
"""
Script to convert extra spells from CSV to JSON format with deduplication and field inference.
Handles differences between copies of the same spell and groups by source material.
"""

import json
import csv
import os
import re
from pathlib import Path
from collections import defaultdict

def clean_spell_name(name):
    """Clean spell name by removing ritual tags and extra whitespace."""
    if not name:
        return ""
    
    # Remove ritual tags - case insensitive
    cleaned = re.sub(r'\s*\(ritual\)\s*', '', name, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    cleaned = cleaned.strip()
    
    return cleaned

def extract_ritual_from_name(name):
    """Extract ritual flag from spell name."""
    return bool(re.search(r'\s*\(ritual\)\s*', name, flags=re.IGNORECASE))

def extract_concentration_from_duration(duration):
    """Extract concentration flag from duration field."""
    if not duration:
        return False
    return 'concentration' in duration.lower()

def extract_material_from_description(description):
    """Extract material component from description and return (material, cleaned_description)."""
    if not description:
        return "", ""
    
    # Look for material components in parentheses at the start of description
    material_match = re.match(r'^\(([^)]+)\)', description.strip())
    if material_match:
        material = material_match.group(1).strip()
        # Remove the material component from the description
        cleaned_desc = re.sub(r'^\([^)]+\)', '', description.strip()).strip()
        return material, cleaned_desc
    
    return "", description

def parse_school_from_csv(school_text):
    """Parse school of magic from CSV school field."""
    if not school_text:
        return ""
    
    # Handle cases where the field contains level information instead of school
    # Check if it looks like a level (e.g., "3rd", "1st", "2nd", etc.)
    level_pattern = r'^\d+(st|nd|rd|th)$'
    if re.match(level_pattern, school_text.strip(), re.IGNORECASE):
        # This is a level, not a school - return empty string
        return ""
    
    # Try to extract school from "Xth level School" pattern first (most specific)
    level_school_match = re.search(r'\d+(st|nd|rd|th)\s+level\s+(\w+)', school_text, re.IGNORECASE)
    if level_school_match:
        return level_school_match.group(2).title()
    
    # Extract school name from patterns like:
    # "Conjuration cantrip", "1st level Abjuration"
    school_match = re.search(r'(\w+)(?:\s+cantrip|\s+level)', school_text, re.IGNORECASE)
    if school_match:
        return school_match.group(1).title()
    
    # If no pattern matches, try to extract the first word
    words = school_text.split()
    if words:
        # Check if the first word is a level indicator
        if re.match(level_pattern, words[0], re.IGNORECASE):
            return ""
        return words[0].title()
    
    return school_text

def infer_source_from_class(class_text):
    """Infer source material from class field."""
    if not class_text:
        return "Unknown"
    
    # Common source abbreviations (only these are actual source books)
    source_mapping = {
        'TCE': 'TashasCauldron',
        'SCAG': 'SwordCoast',
        'XGE': 'XanatharsGuide',
        'FTD': 'FizbansTreasury',
        'SCC': 'Strixhaven',
        'VRGR': 'VanRichtens',
        'WBW': 'WildBeyondWitchlight',
        'EGW': 'ExplorersGuide',
        'MTF': 'MordenkainensTome',
        'GGR': 'GuildmastersGuide',
        'AI': 'AcquisitionsIncorporated',
        'LLK': 'LocathahRising',
        'BMT': 'BigbysManifesto',
        'SAC': 'SageAdviceCompendium'
    }
    
    # Look for source abbreviations in parentheses
    source_match = re.search(r'\(([^)]+)\)', class_text)
    if source_match:
        source_abbr = source_match.group(1).strip()
        # Only return the source if it's a known source abbreviation
        if source_abbr in source_mapping:
            return source_mapping[source_abbr]
        # Otherwise, it's likely a subclass name, treat as Core
        else:
            return "Core"
    
    return "Core"  # Default for spells without source abbreviation

def parse_components_from_csv(components_text):
    """Parse components from CSV format to array."""
    if not components_text:
        return []
    
    # Split by comma and clean up
    components = [comp.strip() for comp in components_text.split(',')]
    return [comp for comp in components if comp]

def sanitize_class_name(class_text):
    """Extract base class name from class field, removing subclass and source info."""
    if not class_text:
        return ""
    
    # Extract the base class name (before any parentheses)
    base_class = class_text.split('(')[0].strip()
    
    # Clean up any extra whitespace or special characters
    base_class = base_class.strip()
    
    return base_class

def union_class_names(class_lists):
    """Union and sanitize class names from multiple spell copies."""
    all_classes = set()
    
    for class_text in class_lists:
        if class_text:
            # Split by comma to handle multiple classes in one entry
            classes = [cls.strip() for cls in class_text.split(',')]
            for cls in classes:
                sanitized = sanitize_class_name(cls)
                if sanitized:
                    all_classes.add(sanitized)
    
    return sorted(list(all_classes))

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
    """Load spell data from a CSV file."""
    csv_spells = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            
            for row_num, row in enumerate(reader, 1):
                if len(row) >= 9:  # Ensure we have all required columns
                    spell_data = {
                        'level': int(row[0]) if row[0].isdigit() else 0,
                        'name': row[1].strip('"'),
                        'school': row[2].strip('"'),
                        'casting_time': row[3].strip('"'),
                        'range': row[4].strip('"'),
                        'components': row[5].strip('"'),
                        'duration': row[6].strip('"'),
                        'description': row[7].strip('"'),
                        'classes': row[8].strip('"'),
                        'file': csv_file.name,
                        'row': row_num
                    }
                    csv_spells.append(spell_data)
        
        print(f"Loaded {len(csv_spells)} spells from {csv_file.name}")
        return csv_spells
    
    except Exception as e:
        print(f"Error loading CSV {csv_file}: {e}")
        return []

def normalize_for_comparison(value):
    """Normalize a value for comparison by handling capitalization and whitespace."""
    if not value:
        return ""
    
    # Convert to string if it's not already
    value_str = str(value)
    
    # Normalize whitespace and capitalization
    normalized = value_str.strip().lower()
    
    # Handle common capitalization patterns
    # Convert to title case for proper nouns, but keep common words lowercase
    words = normalized.split()
    normalized_words = []
    
    for word in words:
        # Keep common words lowercase
        if word in ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']:
            normalized_words.append(word)
        else:
            normalized_words.append(word.capitalize())
    
    return ' '.join(normalized_words)

def compare_spell_copies(spell_copies):
    """Compare multiple copies of the same spell and return differences with source file info."""
    if len(spell_copies) <= 1:
        return {}
    
    differences = {}
    
    # Compare each field (excluding 'classes' since they're expected to differ)
    fields_to_compare = ['level', 'school', 'casting_time', 'range', 'components', 'duration', 'description']
    
    for field in fields_to_compare:
        # Create a mapping of normalized value -> list of (original_value, source_file)
        normalized_to_originals = {}
        
        for copy in spell_copies:
            value = copy[field]
            source_file = copy['file']
            normalized = normalize_for_comparison(value)
            
            if normalized not in normalized_to_originals:
                normalized_to_originals[normalized] = []
            normalized_to_originals[normalized].append((value, source_file))
        
        # Only report differences if there are multiple unique normalized values
        if len(normalized_to_originals) > 1:
            differences[field] = {}
            for normalized_value, original_sources in normalized_to_originals.items():
                # Group by original value to handle multiple sources with same original
                value_to_sources = {}
                for original_value, source_file in original_sources:
                    if original_value not in value_to_sources:
                        value_to_sources[original_value] = []
                    value_to_sources[original_value].append(source_file)
                
                # Add to differences
                for original_value, sources in value_to_sources.items():
                    unique_sources = sorted(list(set(sources)))
                    differences[field][original_value] = unique_sources
    
    return differences

def create_spell_json(spell_data, unioned_classes=None):
    """Convert CSV spell data to JSON format."""
    # Clean the spell name and extract ritual flag
    clean_name = clean_spell_name(spell_data['name'])
    is_ritual = extract_ritual_from_name(spell_data['name'])
    
    # Extract material component and clean description
    material, clean_description = extract_material_from_description(spell_data['description'])
    
    # Extract concentration flag
    is_concentration = extract_concentration_from_duration(spell_data['duration'])
    
    # Parse other fields
    school = parse_school_from_csv(spell_data['school'])
    components = parse_components_from_csv(spell_data['components'])
    source = infer_source_from_class(spell_data['classes'])
    
    # Use unioned classes if provided, otherwise sanitize single class
    if unioned_classes:
        classes = unioned_classes
    else:
        classes = [sanitize_class_name(spell_data['classes'])]
    
    # Create JSON structure
    spell_json = {
        'name': clean_name,
        'level': spell_data['level'],
        'school': school,
        'casting_time': spell_data['casting_time'],
        'range': spell_data['range'],
        'components': components,
        'duration': spell_data['duration'],
        'description': clean_description,
        'classes': classes,
        'ritual': is_ritual,
        'concentration': is_concentration,
        'material': material if material else None,
        'source': source,
        'source_file': spell_data['file'],
        'source_row': spell_data['row']
    }
    
    # Remove None values
    spell_json = {k: v for k, v in spell_json.items() if v is not None}
    
    return spell_json

def main():
    """Main function to process extra spells."""
    spells_dir = Path(__file__).parent
    srd_json_file = spells_dir / "5e-SRD-Spells.json"
    
    # Load SRD spells
    srd_spells = load_srd_spells(srd_json_file)
    if not srd_spells:
        print("Failed to load SRD spells. Exiting.")
        return
    
    # Find all CSV files
    csv_files = list(spells_dir.glob("*.csv"))
    
    # Collect all extra spells
    all_extra_spells = []
    
    for csv_file in csv_files:
        csv_spells = load_csv_spells(csv_file)
        
        for spell in csv_spells:
            clean_name = clean_spell_name(spell['name'])
            if clean_name not in srd_spells:
                all_extra_spells.append(spell)
    
    print(f"\nFound {len(all_extra_spells)} total extra spell entries")
    
    # Group by clean spell name for deduplication
    spells_by_name = defaultdict(list)
    for spell in all_extra_spells:
        clean_name = clean_spell_name(spell['name'])
        spells_by_name[clean_name].append(spell)
    
    print(f"Found {len(spells_by_name)} unique extra spells")
    
    # Process each unique spell
    processed_spells = []
    warnings = []
    
    for spell_name, spell_copies in spells_by_name.items():
        # Union all class names from all copies
        all_class_texts = [copy['classes'] for copy in spell_copies]
        unioned_classes = union_class_names(all_class_texts)
        
        if len(spell_copies) > 1:
            # Check for differences (excluding classes since they're expected to differ)
            differences = compare_spell_copies(spell_copies)
            if differences:
                warning = f"WARNING: Spell '{spell_name}' has {len(spell_copies)} copies with differences:"
                for field, value_to_sources in differences.items():
                    warning += f"\n  - {field}:"
                    for value, sources in value_to_sources.items():
                        source_list = ", ".join([f"{src}" for src in sources])
                        warning += f"\n    * \"{value}\" (in {source_list})"
                warnings.append(warning)
                print(warning)
            
            # Choose the "best" copy (prefer Core over expansions, then first occurrence)
            best_copy = spell_copies[0]  # Default to first
            for copy in spell_copies:
                if 'Core' in copy['classes'] or '(' not in copy['classes']:
                    best_copy = copy
                    break
            
            processed_spells.append(create_spell_json(best_copy, unioned_classes))
        else:
            processed_spells.append(create_spell_json(spell_copies[0], unioned_classes))
    
    # Group spells by source
    spells_by_source = defaultdict(list)
    for spell in processed_spells:
        source = spell.get('source', 'Unknown')
        spells_by_source[source].append(spell)
    
    # Output JSON files
    print(f"\n=== OUTPUTTING JSON FILES ===")
    
    for source, spells in spells_by_source.items():
        # Clean filename to avoid invalid characters
        clean_source = re.sub(r'[<>:"/\\|?*]', '_', source)
        filename = f"{clean_source}.json" if source != "Unknown" else "AdditionalSpells.json"
        filepath = spells_dir / filename
        
        # Sort spells by level, then name
        spells.sort(key=lambda x: (x['level'], x['name']))
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(spells, f, indent=2, ensure_ascii=False)
        
        print(f"Created {filename} with {len(spells)} spells")
    
    # Summary
    print(f"\n=== SUMMARY ===")
    print(f"Total unique extra spells: {len(processed_spells)}")
    print(f"Warnings generated: {len(warnings)}")
    print(f"Files created: {len(spells_by_source)}")
    
    for source, spells in spells_by_source.items():
        filename = f"{source}.json" if source != "Unknown" else "AdditionalSpells.json"
        print(f"  - {filename}: {len(spells)} spells")

if __name__ == "__main__":
    main()
