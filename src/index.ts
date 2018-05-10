import { Credentials, SessionStore } from './types';
import SessionManager from './SessionManager';
import CookieSessionStore from "./CookieSessionStore";
import MemorySessionStore from './MemorySessionStore';
import LocalStorageSessionStore, {localStorageSupported} from "./LocalStorageSessionStore";
import * as API from './api';

let manager = new SessionManager();
function setStore(store: SessionStore): void {
  manager.setStore(store);
}

export function restoreSession(): Promise<void> {
  return manager.restoreSession();
}

export function importSession(): Promise<void> {
  return manager.refresh();
}

export function setCookieStore(sessionName: string): void {
  setStore(new CookieSessionStore(sessionName));
}

export function setLocalStorageStore(sessionName: string): void {
  localStorageSupported() ?
    setStore(new LocalStorageSessionStore(sessionName)) :
    setStore(new MemorySessionStore);
}

export function session(): string | undefined {
  return manager.sessionToken();
}

export function signup(credentials: Credentials): Promise<void> {
  return API.signup(credentials)
    .then((token) => manager.update(token));
}

export function login(credentials: Credentials): Promise<void> {
  return API.login(credentials)
    .then((token) => manager.update(token));
}

export function logout(): Promise<void> {
  return API.logout()
    .then(() => manager.endSession());
}

export function changePassword(args: {password: string, currentPassword: string}): Promise<void> {
  return API.changePassword(args)
    .then((token) => manager.update(token));
}

export function resetPassword(args: {password: string, token: string}): Promise<void> {
  return API.resetPassword(args)
    .then((token) => manager.update(token));
}

// export remaining API methods unmodified
export {
  setHost,
  isAvailable,
  requestPasswordReset
} from "./api";
