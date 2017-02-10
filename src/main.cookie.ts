import CookieSessionStore from "./CookieSessionStore";
import { setStore } from "./main";

// all of main
export * from "./main";

// plus cookie config
export function setSessionName(sessionName: string): void {
  setStore(new CookieSessionStore(sessionName));
}
