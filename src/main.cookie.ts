import { SessionStore } from "./session_store";
import { SessionManager } from "./session_manager";
import { CookieSessionStore } from "./cookie_store";
import { Credentials } from "./credentials";
import { signup as signupAPI, login as loginAPI } from "./api";

const unconfigured: string = "AuthN must be configured with setSession()";

let store: SessionStore|undefined;

export function setSession(cookieName: string): void {
  store = new CookieSessionStore(cookieName);
}

export function signup(credentials: Credentials): Promise<string> {
  return signupAPI(credentials)
    .then(updateAndReturn);
}

export function login(credentials: Credentials): Promise<string> {
  return loginAPI(credentials)
    .then(updateAndReturn);
}

export function maintainSession(): void {
  if (!store) { throw unconfigured }
  (new SessionManager(store)).maintain();
}

// export remaining API methods unmodified
export * from "./api";

function updateAndReturn(token: string) {
  if (!store) { throw unconfigured };
  store.update(token);
  return token;
}
