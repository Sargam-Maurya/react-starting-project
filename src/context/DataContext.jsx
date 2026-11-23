import { createContext, useContext, useState, useCallback } from "react";
import { loadDatabase, persistEntity } from "../services/dataService";
import { generateId } from "../utils/idGenerator";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [db, setDb] = useState(() => loadDatabase());

  const commit = useCallback((entity, updater) => {
    setDb((prev) => {
      const nextRecords = updater(prev[entity]);
      persistEntity(entity, nextRecords);
      return { ...prev, [entity]: nextRecords };
    });
  }, []);

  const addRecord = useCallback(
    (entity, record) => commit(entity, (records) => [...records, record]),
    [commit]
  );

  const updateRecord = useCallback(
    (entity, id, updates) =>
      commit(entity, (records) =>
        records.map((r) => (r.id === id ? { ...r, ...updates } : r))
      ),
    [commit]
  );

  const deleteRecord = useCallback(
    (entity, id) =>
      commit(entity, (records) => records.filter((r) => r.id !== id)),
    [commit]
  );

  const logAudit = useCallback(
    (action, referenceId, details) => {
      const entry = {
        id: generateId("LOG"),
        timestamp: new Date().toISOString(),
        user: user?.name ?? "System",
        action,
        referenceId,
        details,
      };
      commit("auditLogs", (logs) => [entry, ...logs]);
    },
    [commit, user]
  );

  const value = {
    agents: db.agents,
    customers: db.customers,
    collections: db.collections,
    deposits: db.deposits,
    auditLogs: db.auditLogs,
    branches: db.branches,
    addRecord,
    updateRecord,
    deleteRecord,
    logAudit,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
