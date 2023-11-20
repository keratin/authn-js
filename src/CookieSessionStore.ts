import { SessionStore } from "./types";

export interface CookieSessionStoreOptions {
  domain?: string;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  useExplicitExpiry?: boolean;
}

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  private readonly path: string;
  private readonly sameSite: string;
  private readonly useExplicitExpiry: boolean;
  private readonly domain: string;

  constructor(cookieName: string, opts: CookieSessionStoreOptions = {}) {
    this.sessionName = cookieName;
    this.path = !!opts.path ? `; path=${opts.path}` : "";
    this.domain = !!opts.domain ? `; domain=${opts.domain}` : "";
    this.sameSite = !!opts.sameSite ? `; SameSite=${opts.sameSite}` : "";
    this.useExplicitExpiry = !!opts.useExplicitExpiry;
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

  update(val: string, exp: number | undefined) {
    if (typeof document !== "undefined") {
      let expires = "";
      if (this.useExplicitExpiry && !!exp) {
        const expiresDate = new Date();
        expiresDate.setTime(exp);
        expires = `; expires=${expiresDate.toUTCString()}`;
      }
      document.cookie = `${this.sessionName}=${val}${this.secureFlag}${expires}${this.path}${this.sameSite}${this.domain}`;
    }
  }

  delete() {
    if (typeof document !== "undefined") {
      document.cookie =
        `${this.sessionName}=${this.secureFlag}; expires=Thu, 01 Jan 1970 00:00:01 GMT;${this.path}${this.sameSite}${this.domain}`;
    }
  }
}
