import { SessionStore } from "./session_store";
import { SessionManager } from "./session_manager";
import { CookieSessionStore } from "./cookie_store";
import { Credentials } from "./credentials";
import { signup as signupAPI, login as loginAPI } from "./api";

const unconfigured: string = "AuthN must be configured with setSession()";

let store: SessionStore|undefined;
let manager: SessionManager;

export function setSessionName(cookieName: string): void {
  store = new CookieSessionStore(cookieName);
  manager = new SessionManager(store);
  manager.maintain();
}

export function signup(credentials: Credentials): Promise<string> {
  return signupAPI(credentials)
    .then(updateAndReturn);
}

export function login(credentials: Credentials): Promise<string> {
  return loginAPI(credentials)
    .then(updateAndReturn);
}

// export remaining API methods unmodified
export * from "./api";

function updateAndReturn(token: string) {
  if (!manager) { throw unconfigured };
  manager.updateAndMaintain(token);
  return token;
}
