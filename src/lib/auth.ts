import api from './api';
import type { User } from '../types/index';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function setCurrentUser(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getStoredUser(): User | null {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await api.auth.me();
    try {
      setCurrentUser(user);
    } catch {}
    return user;
  } catch (err) {
    return null;
  }
}

export default {
  setToken,
  getToken,
  clearToken,
  setCurrentUser,
  getStoredUser,
  getCurrentUser,
};
