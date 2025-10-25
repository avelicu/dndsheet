#!/usr/bin/env python3
"""
Debug script to understand the source inference problem.
"""

import csv
import json
import re

def infer_source_from_class(class_text):
    """Debug version of source inference."""
    if not class_text:
        return "Unknown"
    
    print(f"Processing class text: '{class_text}'")
    
    # Common source abbreviations
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
        print(f"  Found source abbreviation: '{source_abbr}'")
        
        if source_abbr in source_mapping:
            result = source_mapping[source_abbr]
            print(f"  Mapped to: '{result}'")
            return result
        else:
            print(f"  Unknown abbreviation, returning: '{source_abbr}'")
            return source_abbr
    
    print(f"  No parentheses found, returning: 'Core'")
    return "Core"  # Default for spells without source abbreviation

def main():
    """Test the source inference with problematic examples."""
    test_cases = [
        "Sorcerer (Aberrant Mind)",
        "Warlock (Fathomless)", 
        "Artificer (Battle Smith)",
        "Cleric (Twilight)",
        "Wizard (TCE)",
        "Sorcerer (XGE)",
        "Wizard",
        "Sorcerer"
    ]
    
    print("=== TESTING SOURCE INFERENCE ===")
    for case in test_cases:
        print(f"\nInput: '{case}'")
        result = infer_source_from_class(case)
        print(f"Result: '{result}'")
    
    print("\n=== THE PROBLEM ===")
    print("The issue is that subclass names like 'Aberrant Mind', 'Fathomless', etc.")
    print("are being treated as source materials instead of recognizing them as")
    print("subclass names that should be ignored for source inference.")

if __name__ == "__main__":
    main()
