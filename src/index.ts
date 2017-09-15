import { Credentials, SessionStore } from './types';
import SessionManager from './SessionManager';
import CookieSessionStore from "./CookieSessionStore";
import LocalStorageSessionStore from "./LocalStorageSessionStore";
import * as API from './api';

let manager = new SessionManager();
function setStore(store: SessionStore): void {
  manager.setStore(store);
}

export function restoreSession(): Promise<void> {
  return manager.restoreSession();
}

export function setCookieStore(sessionName: string): void {
  setStore(new CookieSessionStore(sessionName));
}

export function setLocalStorageStore(sessionName: string): void {
  setStore(new LocalStorageSessionStore(sessionName));
}

export function session(): string | undefined {
  return manager.session ? manager.session.token : undefined;
}

export function signup(credentials: Credentials): Promise<void> {
  return API.signup(credentials)
    .then(updateStore);
}

export function login(credentials: Credentials): Promise<void> {
  return API.login(credentials)
    .then(updateStore);
}

export function logout(): Promise<void> {
  return API.logout()
    .then(() => manager.endSession());
}

export function changePassword(args: {password: string, currentPassword: string}): Promise<void> {
  return API.changePassword(args)
    .then(updateStore);
}

export function resetPassword(args: {password: string, token: string}): Promise<void> {
  return API.resetPassword(args)
    .then(updateStore);
}

// export remaining API methods unmodified
export {
  setHost,
  isAvailable,
  requestPasswordReset
} from "./api";

function updateStore(token: string) {
  manager.updateAndMaintain(token);
}
