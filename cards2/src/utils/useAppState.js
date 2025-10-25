import { useState, useEffect, useCallback } from 'react';
import stateManager from './stateManager';

/**
 * Custom hook for managing spell selection state with localStorage persistence
 * @returns {Object} Spell selection state and update function
 */
export const useSpellSelection = () => {
  const [spellSelection, setSpellSelection] = useState(() => stateManager.getState().spellSelection);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe('spellSelection', (newSpellSelection) => {
      setSpellSelection(newSpellSelection);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const updateSpellSelection = useCallback((newSpellSelection) => {
    stateManager.updateSpellSelection(newSpellSelection);
  }, []);

  return {
    spellSelection,
    updateSpellSelection
  };
};

/**
 * Custom hook for managing layout configuration state with localStorage persistence
 * @returns {Object} Layout config state and update function
 */
export const useLayoutConfig = () => {
  const [layoutConfig, setLayoutConfig] = useState(() => stateManager.getState().layoutConfig);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe('layoutConfig', (newLayoutConfig) => {
      setLayoutConfig(newLayoutConfig);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const updateLayoutConfig = useCallback((newLayoutConfig) => {
    stateManager.updateLayoutConfig(newLayoutConfig);
  }, []);

  return {
    layoutConfig,
    updateLayoutConfig
  };
};

/**
 * Custom hook for managing debug flags with localStorage persistence
 */
export const useDebugFlags = () => {
  const [debug, setDebug] = useState(() => stateManager.getState().debug);

  useEffect(() => {
    const unsubscribe = stateManager.subscribe('debug', (newDebug) => {
      setDebug(newDebug);
    });
    return unsubscribe;
  }, []);

  const updateDebug = useCallback((newDebug) => {
    stateManager.updateDebug(newDebug);
  }, []);

  return { debug, updateDebug };
};

/**
 * Custom hook for managing source selection state with localStorage persistence
 * @returns {Object} Source selection state and update function
 */
export const useSourceSelection = () => {
  const [sourceSelection, setSourceSelection] = useState(() => stateManager.getState().sourceSelection);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe('sourceSelection', (newSourceSelection) => {
      setSourceSelection(newSourceSelection);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const updateSourceSelection = useCallback((newSourceSelection) => {
    stateManager.updateSourceSelection(newSourceSelection);
  }, []);

  return {
    sourceSelection,
    updateSourceSelection
  };
};

/**
 * Custom hook for managing all application state
 * @returns {Object} Complete state and update functions
 */
export const useAppState = () => {
  const spellSelection = useSpellSelection();
  const layoutConfig = useLayoutConfig();
  const debugFlags = useDebugFlags();
  const sourceSelection = useSourceSelection();

  const resetState = useCallback(() => {
    stateManager.reset();
  }, []);

  const exportState = useCallback(() => {
    return stateManager.exportState();
  }, []);

  const importState = useCallback((stateJson) => {
    stateManager.importState(stateJson);
  }, []);

  return {
    ...spellSelection,
    ...layoutConfig,
    ...debugFlags,
    ...sourceSelection,
    resetState,
    exportState,
    importState
  };
};
