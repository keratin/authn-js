import { Credentials, SessionStore, OtpData } from "./types";
import SessionManager from "./SessionManager";
import CookieSessionStore, {
  CookieSessionStoreOptions,
} from "./CookieSessionStore";
import MemorySessionStore from "./MemorySessionStore";
import LocalStorageSessionStore, {
  localStorageSupported,
} from "./LocalStorageSessionStore";
import API from "./api";

let api = new API("");
let manager = new SessionManager(api);

function setStore(store: SessionStore): void {
  manager.setStore(store);
}

export function setCookieStore(
  sessionName: string,
  opts?: CookieSessionStoreOptions
): void {
  setStore(new CookieSessionStore(sessionName, opts));
}

export function setLocalStorageStore(sessionName: string): void {
  localStorageSupported()
    ? setStore(new LocalStorageSessionStore(sessionName))
    : setStore(new MemorySessionStore());
}

export function signup(credentials: Credentials): Promise<void> {
  return api.signup(credentials).then((token) => manager.update(token));
}

export function login(credentials: Credentials): Promise<void> {
  return api.login(credentials).then((token) => manager.update(token));
}

export function logout(): Promise<void> {
  return api.logout().then(() => manager.endSession());
}

export function changePassword(args: {
  password: string;
  currentPassword: string;
}): Promise<void> {
  return api.changePassword(args).then((token) => manager.update(token));
}

export function resetPassword(args: {
  password: string;
  token: string;
}): Promise<void> {
  return api.resetPassword(args).then((token) => manager.update(token));
}

export function sessionTokenLogin(args: {
  token: string;
  otp?: string;
}): Promise<void> {
  return api.sessionTokenLogin(args).then((token) => manager.update(token));
}

// export remaining API methods unmodified
export const {
  setHost,
  isAvailable,
  requestPasswordReset,
  requestSessionToken,
  newTOTP,
  confirmTOTP,
  deleteTOTP,
  beginOAuthUrl,
} = api;

// export remaining SessionManager methods unmodified
export const {
  restoreSession,
  refresh: importSession,
  sessionToken: session,
} = manager;
