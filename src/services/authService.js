import { DEMO_USERS } from "../mock/users";
import { STORAGE_KEYS } from "../constants";
import { getItem, setItem } from "../utils/storage";
import { delay } from "./api";

function getRegisteredUsers() {
  return getItem(STORAGE_KEYS.REGISTERED_USERS, []);
}

function allUsers() {
  return [...DEMO_USERS, ...getRegisteredUsers()];
}

function toSession(user) {
  const { password: _password, ...safeUser } = user;
  return { user: safeUser, token: `demo-token-${safeUser.id}` };
}

/**
 * Mock auth service. Replace with apiClient.post("/auth/login", ...)
 * when a real backend is available.
 */
export async function login(email, password) {
  await delay(500);

  const user = allUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  return toSession(user);
}

export async function register({ name, email, password, role, branch }) {
  await delay(500);

  if (
    allUsers().some((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  ) {
    throw new Error("An account with this email already exists");
  }

  const registered = getRegisteredUsers();
  const user = {
    id: `USR-${String(DEMO_USERS.length + registered.length + 1).padStart(3, "0")}`,
    name: name.trim(),
    email: email.trim(),
    password,
    role: role || "Collection Agent",
    branch: branch || "Mumbai Central",
  };

  setItem(STORAGE_KEYS.REGISTERED_USERS, [...registered, user]);
  return toSession(user);
}
