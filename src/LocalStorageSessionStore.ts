import { SessionStore } from "./types";

export function localStorageSupported(): boolean {
  const str = "keratin-authn-test";
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(str, str);
      window.localStorage.removeItem(str);
    }
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
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(this.sessionName) || undefined;
    }
  }

  update(val: string, exp: number | undefined) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(this.sessionName, val);
    }
  }

  delete() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(this.sessionName);
    }
  }
}
