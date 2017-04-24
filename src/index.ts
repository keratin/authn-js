import { Credentials, SessionStore } from './types';
import SessionManager from './SessionManager';
import CookieSessionStore from "./CookieSessionStore";
import LocalStorageSessionStore from "./LocalStorageSessionStore";
import {
  signup as signupAPI,
  login as loginAPI,
  logout as logoutAPI,
  changePassword as changePasswordAPI
} from "./api";

let manager = new SessionManager();
function setStore(store: SessionStore): void {
  manager.setStore(store);
  manager.restoreSession();
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
  return signupAPI(credentials)
    .then(updateStore);
}

export function login(credentials: Credentials): Promise<void> {
  return loginAPI(credentials)
    .then(updateStore);
}

export function logout(): Promise<void> {
  return logoutAPI()
    .then(() => manager.endSession());
}

export function changePassword(args: {password: string, token?: string}): Promise<void> {
  return changePasswordAPI(args)
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
