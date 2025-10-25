// Note: We no longer persist derived spell lists, so no need to import Spell here

/**
 * Centralized state management with localStorage persistence
 * Handles all application state in a maintainable way
 */

// Define the shape of our application state
const DEFAULT_STATE = {
  spellSelection: {
    selectedClasses: [],
    selectedLevels: [],
    filteredSpells: [],
    additionalSpellNames: [],
    spellCount: 0
  },
  layoutConfig: {
    pageSize: 'letter',
    cardSize: 'standard'
  },
  debug: {
    showOutlines: false
  },
  sourceSelection: {
    enabledSources: [],
    hasUserChoice: false  // Track if user has made an explicit choice
  }
};

// State keys for localStorage
const STORAGE_KEYS = {
  SPELL_SELECTION: 'dnd-spell-creator-spell-selection',
  LAYOUT_CONFIG: 'dnd-spell-creator-layout-config',
  DEBUG: 'dnd-spell-creator-debug',
  SOURCE_SELECTION: 'dnd-spell-creator-source-selection'
};

/**
 * Generic localStorage utility functions
 */
const StorageUtils = {
  /**
   * Save data to localStorage with error handling
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      console.log(`Saved to localStorage: ${key}`);
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
    }
  },

  /**
   * Load data from localStorage with error handling
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if loading fails
   * @returns {any} Loaded data or default value
   */
  load(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      console.log(`Raw localStorage data for ${key}:`, serialized);
      if (serialized === null) {
        console.log(`No data found for ${key}, using default:`, defaultValue);
        return defaultValue;
      }
      const parsed = JSON.parse(serialized);
      console.log(`Parsed data for ${key}:`, parsed);

      console.log(`Loaded from localStorage: ${key}`);
      return parsed;
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      console.log(`Removed from localStorage: ${key}`);
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error);
    }
  },

  /**
   * Clear all application data from localStorage
   */
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.remove(key);
    });
  }
};

/**
 * State management class that handles persistence automatically
 */
class StateManager {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = new Map();
    this.loadState();
  }

  /**
   * Load state from localStorage on initialization
   */
  loadState() {
    const loadedSpellSelection = StorageUtils.load(
      STORAGE_KEYS.SPELL_SELECTION, 
      DEFAULT_STATE.spellSelection
    );
    const savedSpellSelection = { ...DEFAULT_STATE.spellSelection, ...loadedSpellSelection };
    
    const loadedLayoutConfig = StorageUtils.load(
      STORAGE_KEYS.LAYOUT_CONFIG, 
      DEFAULT_STATE.layoutConfig
    );
    const savedLayoutConfig = { ...DEFAULT_STATE.layoutConfig, ...loadedLayoutConfig };

    const loadedDebug = StorageUtils.load(
      STORAGE_KEYS.DEBUG,
      DEFAULT_STATE.debug
    );
    const savedDebug = { ...DEFAULT_STATE.debug, ...loadedDebug };

    const loadedSourceSelection = StorageUtils.load(
      STORAGE_KEYS.SOURCE_SELECTION,
      DEFAULT_STATE.sourceSelection
    );
    const savedSourceSelection = { ...DEFAULT_STATE.sourceSelection, ...loadedSourceSelection };

    this.state = {
      spellSelection: savedSpellSelection,
      layoutConfig: savedLayoutConfig,
      debug: savedDebug,
      sourceSelection: savedSourceSelection
    };

    console.log('State loaded from localStorage:', this.state);
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update spell selection state
   * @param {Object} spellSelection - New spell selection data
   */
  updateSpellSelection(spellSelection) {
    // Whitelist only non-derived fields
    const next = {
      selectedClasses: spellSelection.selectedClasses || [],
      selectedLevels: spellSelection.selectedLevels || [],
      additionalSpellNames: spellSelection.additionalSpellNames || []
    };
    this.state.spellSelection = { ...this.state.spellSelection, ...next };
    this.saveSpellSelection();
    this.notifyListeners('spellSelection', this.state.spellSelection);
  }

  /**
   * Update layout configuration state
   * @param {Object} layoutConfig - New layout configuration
   */
  updateLayoutConfig(layoutConfig) {
    this.state.layoutConfig = { ...layoutConfig };
    this.saveLayoutConfig();
    this.notifyListeners('layoutConfig', this.state.layoutConfig);
  }

  updateDebug(debug) {
    this.state.debug = { ...debug };
    StorageUtils.save(STORAGE_KEYS.DEBUG, this.state.debug);
    this.notifyListeners('debug', this.state.debug);
  }

  /**
   * Update source selection state
   * @param {Object} sourceSelection - New source selection data
   */
  updateSourceSelection(sourceSelection) {
    this.state.sourceSelection = { 
      ...sourceSelection,
      hasUserChoice: true  // Mark that user has made an explicit choice
    };
    this.saveSourceSelection();
    this.notifyListeners('sourceSelection', this.state.sourceSelection);
  }

  /**
   * Save spell selection to localStorage
   */
  saveSpellSelection() {
    // Persist only the whitelisted, non-derived fields
    const toSave = {
      selectedClasses: this.state.spellSelection.selectedClasses || [],
      selectedLevels: this.state.spellSelection.selectedLevels || [],
      additionalSpellNames: this.state.spellSelection.additionalSpellNames || []
    };
    StorageUtils.save(STORAGE_KEYS.SPELL_SELECTION, toSave);
  }

  /**
   * Save layout config to localStorage
   */
  saveLayoutConfig() {
    StorageUtils.save(STORAGE_KEYS.LAYOUT_CONFIG, this.state.layoutConfig);
  }

  /**
   * Save source selection to localStorage
   */
  saveSourceSelection() {
    StorageUtils.save(STORAGE_KEYS.SOURCE_SELECTION, this.state.sourceSelection);
  }

  /**
   * Subscribe to state changes
   * @param {string} stateKey - Key to listen for changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(stateKey, callback) {
    if (!this.listeners.has(stateKey)) {
      this.listeners.set(stateKey, new Set());
    }
    
    this.listeners.get(stateKey).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(stateKey);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Notify listeners of state changes
   * @param {string} stateKey - Key that changed
   * @param {any} newValue - New value
   */
  notifyListeners(stateKey, newValue) {
    const listeners = this.listeners.get(stateKey);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue);
        } catch (error) {
          console.error(`Error in state listener for ${stateKey}:`, error);
        }
      });
    }
  }

  /**
   * Reset state to defaults
   */
  reset() {
    this.state = { ...DEFAULT_STATE };
    StorageUtils.clearAll();
    this.notifyListeners('spellSelection', this.state.spellSelection);
    this.notifyListeners('layoutConfig', this.state.layoutConfig);
    this.notifyListeners('sourceSelection', this.state.sourceSelection);
    console.log('State reset to defaults');
  }

  /**
   * Export current state (for debugging or backup)
   * @returns {string} JSON string of current state
   */
  exportState() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state from JSON string
   * @param {string} stateJson - JSON string of state
   */
  importState(stateJson) {
    try {
      const importedState = JSON.parse(stateJson);
      
      // Reconstruct Spell objects if they exist
      if (importedState.spellSelection && importedState.spellSelection.filteredSpells) {
        importedState.spellSelection.filteredSpells = importedState.spellSelection.filteredSpells.map(spellData => 
          Spell.fromObject(spellData)
        );
      }
      
      // Validate the imported state structure
      if (this.validateState(importedState)) {
        this.state = { ...importedState };
        this.saveSpellSelection();
        this.saveLayoutConfig();
        this.notifyListeners('spellSelection', this.state.spellSelection);
        this.notifyListeners('layoutConfig', this.state.layoutConfig);
        console.log('State imported successfully');
      } else {
        throw new Error('Invalid state structure');
      }
    } catch (error) {
      console.error('Failed to import state:', error);
      throw error;
    }
  }

  /**
   * Validate state structure
   * @param {Object} state - State to validate
   * @returns {boolean} True if valid
   */
  validateState(state) {
    return (
      state &&
      typeof state === 'object' &&
      state.spellSelection &&
      state.layoutConfig &&
      state.sourceSelection &&
      Array.isArray(state.spellSelection.selectedClasses) &&
      Array.isArray(state.spellSelection.selectedLevels) &&
      Array.isArray(state.sourceSelection.enabledSources) &&
      typeof state.layoutConfig.pageSize === 'string'
    );
  }
}

// Create singleton instance
const stateManager = new StateManager();

export { stateManager, StorageUtils, STORAGE_KEYS };
export default stateManager;
