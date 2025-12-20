import { useState, useEffect, useCallback } from "react";

/**
 * A hook that persists state to localStorage
 * @param key - The localStorage key to use
 * @param defaultValue - The default value if nothing is stored
 * @returns A tuple of [state, setState] similar to useState
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  // Wrapped setter that handles function updates
  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
    },
    []
  );

  return [state, setPersistedState];
}

/**
 * Hook for persisting multiple related state values as an object
 * Useful for pages with multiple filters
 */
export function usePersistedFilters<T extends Record<string, unknown>>(
  key: string,
  defaultFilters: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [filters, setFilters] = usePersistedState<T>(key, defaultFilters);

  // Update specific filter values while preserving others
  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      setFilters((prev) => ({ ...prev, ...updates }));
    },
    [setFilters]
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [setFilters, defaultFilters]);

  return [filters, updateFilters, resetFilters];
}
