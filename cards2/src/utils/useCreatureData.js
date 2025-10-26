import { useState, useEffect, useCallback } from 'react';
import { loadCreatureData } from './creatureDataParser';

/**
 * Custom hook for managing creature data
 * Provides loading state, error handling, and data access methods
 */
export function useCreatureData() {
  const [creatures, setCreatures] = useState([]);
  const [types, setTypes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [challengeRatings, setChallengeRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load creature data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadCreatureData();
        
        setCreatures(data.creatures);
        setTypes(data.types);
        setSizes(data.sizes);
        setChallengeRatings(data.challengeRatings);
        
      } catch (err) {
        console.error('Failed to load creature data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Only run on mount

  // Filter creatures by challenge rating, type, and size
  const filterCreatures = useCallback((cr = null, type = null, size = null) => {
    if (!creatures.length) return [];
    
    return creatures.filter(creature => {
      const matchesCR = !cr || creature.challengeRating === cr.toString();
      const matchesType = !type || creature.type.toLowerCase() === type.toLowerCase();
      const matchesSize = !size || creature.size.toLowerCase() === size.toLowerCase();
      return matchesCR && matchesType && matchesSize;
    });
  }, [creatures]);

  return {
    creatures,
    types,
    sizes,
    challengeRatings,
    filterCreatures,
    loading,
    error
  };
}

