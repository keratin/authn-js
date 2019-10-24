import { SessionStore } from "./types";

export interface CookieSessionStoreOptions {
    path?: string;
    sameSite?: string;
}

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  private readonly path: string;
  private readonly sameSite: string;

  constructor(cookieName: string, opts: CookieSessionStoreOptions = {}) {
    this.sessionName = cookieName;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
    this.path = !!opts.path ? `; path=${opts.path}` : '';
    this.sameSite = !!opts.sameSite ? `; SameSite=${opts.sameSite}` : '';

  }

  read(): string | undefined {
    return document.cookie.replace(new RegExp(`(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`), "$1");
  }

  update(val: string) {
    document.cookie = `${this.sessionName}=${val}${this.secureFlag}${this.path}${this.sameSite}`;
  }

  delete() {
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
