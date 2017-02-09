import SessionManager from "./SessionManager";
import CookieSessionStore from "./CookieSessionStore";
import {
  signup as signupAPI,
  login as loginAPI,
  logout as logoutAPI,
  changePassword as changePasswordAPI
} from "./api";

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

export function logout(): Promise<void> {
  return logoutAPI()
    .then(() => {
      if (!store) { throw unconfigured };
      store.delete();
    });
}

export function changePassword(args: {password: string, token?: string}): Promise<string> {
  return changePasswordAPI(args)
    .then(updateAndReturn);
}

export function session(): Session | undefined {
  return (store) ? store.session : undefined;
}

// export remaining API methods unmodified
export * from "./api";

function updateAndReturn(token: string) {
  if (!manager) { throw unconfigured };
  manager.updateAndMaintain(token);
  return token;
}
