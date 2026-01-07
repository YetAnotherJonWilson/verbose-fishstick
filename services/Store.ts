/**
 * Global store for meditation app state
 */

import {
  StoreType,
  MeditationSessionData,
  PresetData,
} from './types';

type StoreListener = (store: StoreType) => void;

/**
 * StoreManager provides controlled mutations and optional subscriptions
 */
class StoreManager {
  private store: StoreType;
  private listeners: Set<StoreListener> = new Set();

  constructor(store: StoreType) {
    this.store = store;
  }

  /**
   * Set all meditation sessions (replaces existing)
   */
  setMeditationSessions(sessions: MeditationSessionData[]): void {
    this.store.meditationSessions = sessions;
    this.notify();
  }

  /**
   * Set all presets (replaces existing)
   */
  setPresets(presets: PresetData[]): void {
    this.store.presets = presets;
    this.notify();
  }

  /**
   * Subscribe to store changes
   * @returns unsubscribe function
   */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.store));
  }
}

// The raw store object - views can still read directly
const Store: StoreType = {
  meditationSessions: [],
  presets: [],
};

// The manager instance for mutations
export const storeManager = new StoreManager(Store);

// Default export for backward compatibility (views read from this)
export default Store;
