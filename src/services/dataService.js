import { STORAGE_KEYS } from "../constants";
import { getItem, setItem } from "../utils/storage";
import { generateSeedData, BRANCHES } from "../mock/seed";

const ENTITY_STORAGE_KEY = {
  agents: STORAGE_KEYS.AGENTS,
  customers: STORAGE_KEYS.CUSTOMERS,
  collections: STORAGE_KEYS.COLLECTIONS,
  deposits: STORAGE_KEYS.DEPOSITS,
  auditLogs: STORAGE_KEYS.AUDIT_LOGS,
};

/**
 * Loads the demo database from localStorage, seeding it on first run.
 * Swap these implementations for apiClient calls when a real API exists.
 */
export function loadDatabase() {
  if (!getItem(STORAGE_KEYS.DB_INITIALIZED)) {
    const seed = generateSeedData();
    for (const [entity, storageKey] of Object.entries(ENTITY_STORAGE_KEY)) {
      setItem(storageKey, seed[entity]);
    }
    setItem(STORAGE_KEYS.DB_INITIALIZED, true);
    return seed;
  }

  return {
    branches: BRANCHES,
    agents: getItem(STORAGE_KEYS.AGENTS, []),
    customers: getItem(STORAGE_KEYS.CUSTOMERS, []),
    collections: getItem(STORAGE_KEYS.COLLECTIONS, []),
    deposits: getItem(STORAGE_KEYS.DEPOSITS, []),
    auditLogs: getItem(STORAGE_KEYS.AUDIT_LOGS, []),
  };
}

export function persistEntity(entity, records) {
  const storageKey = ENTITY_STORAGE_KEY[entity];
  if (storageKey) setItem(storageKey, records);
}
