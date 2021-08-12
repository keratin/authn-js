import { SessionStore } from "./types";

export interface CookieSessionStoreOptions {
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
}

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  private readonly path: string;
  private readonly sameSite: string;

  constructor(cookieName: string, opts: CookieSessionStoreOptions = {}) {
    this.sessionName = cookieName;

    this.path = !!opts.path ? `; path=${opts.path}` : "";
    this.sameSite = !!opts.sameSite ? `; SameSite=${opts.sameSite}` : "";

    if (typeof window !== "undefined") {
      this.secureFlag = window.location.protocol === "https:" ? "; secure" : "";
    }
  }

  read(): string | undefined {
    if (typeof document !== "undefined") {
      return document.cookie.replace(
        new RegExp(
          `(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`
        ),
        "$1"
      );
    }
  }

  update(val: string) {
    if (typeof document !== "undefined") {
      document.cookie = `${this.sessionName}=${val}${this.secureFlag}${this.path}${this.sameSite}`;
    }
  }

  delete() {
    if (typeof document !== "undefined") {
      document.cookie =
        this.sessionName + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
  }
}
