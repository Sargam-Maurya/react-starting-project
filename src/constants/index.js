export const APP_NAME = "CollectOps";

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  AGENTS: "/agents",
  CUSTOMERS: "/customers",
  COLLECTIONS: "/collections",
  RECONCILIATION: "/reconciliation",
  REPORTS: "/reports",
  AUDIT_LOGS: "/audit-logs",
};

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer"];

export const DEPOSIT_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const AGENT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const STORAGE_KEYS = {
  SESSION: "collectops_session",
  REGISTERED_USERS: "collectops_registered_users",
  DB_INITIALIZED: "collectops_db_initialized",
  AGENTS: "collectops_agents",
  CUSTOMERS: "collectops_customers",
  COLLECTIONS: "collectops_collections",
  DEPOSITS: "collectops_deposits",
  AUDIT_LOGS: "collectops_audit_logs",
};
