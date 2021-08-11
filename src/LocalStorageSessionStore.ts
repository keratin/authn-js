import { SessionStore } from "./types";

export function localStorageSupported(): boolean {
  const str = "keratin-authn-test";
  try {
    window.localStorage.setItem(str, str);
    window.localStorage.removeItem(str);
    return true;
  } catch (e) {
    return false;
  }
}

export default class LocalStorageSessionStore implements SessionStore {
  private readonly sessionName: string;

  constructor(name: string) {
    this.sessionName = name;
  }

  read(): string | undefined {
    return window.localStorage.getItem(this.sessionName) || undefined;
  }

  update(val: string) {
    window.localStorage.setItem(this.sessionName, val);
  }

  delete() {
    window.localStorage.removeItem(this.sessionName);
  }
}
