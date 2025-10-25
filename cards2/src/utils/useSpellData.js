import { useState, useEffect, useCallback } from 'react';
import { loadSpellData } from './spellDataParser';

/**
 * Custom hook for managing spell data
 * Provides loading state, error handling, and data access methods
 * @param {Array<string>} enabledSources - Array of source IDs to load
 */
export function useSpellData(enabledSources = null) {
  const [spells, setSpells] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Load spell data when component mounts or enabledSources change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadSpellData(enabledSources);
        
        setSpells(data.spells);
        setClasses(data.classes);
        setLevels(data.levels);
        
        // Calculate basic stats
        setStats({
          totalSpells: data.spells.length,
          totalClasses: data.classes.length,
          totalLevels: data.levels.length,
          sources: data.sources || []
        });
        
      } catch (err) {
        console.error('Failed to load spell data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [enabledSources]);

  // Filter spells by class and level
  const filterSpells = useCallback((className, level) => {
    if (!spells.length) return [];
    
    return spells.filter(spell => {
      const matchesClass = !className || spell.classes.includes(className);
      const matchesLevel = level === null || spell.level === level;
      return matchesClass && matchesLevel;
    });
  }, [spells]);

  return {
    // Data
    spells,
    classes,
    levels,
    stats,
    
    // State
    loading,
    error,
    
    // Methods
    filterSpells
  };
}
