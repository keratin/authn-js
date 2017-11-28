import { SessionStore } from "./types";
import JWTSession from "./JWTSession";

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  private readonly sessionPath: string;
  private readonly sessionDomain: string;

  constructor(cookieName: string, path: string, domain: string) {
    this.sessionName = cookieName;
    this.sessionPath = '; path=' + path;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
    this.sessionDomain = '; domain=' + domain;
  }

  read(): string | undefined {
    return document.cookie.replace(new RegExp(`(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`), "$1");
  }

  update(val: string) {
  document.cookie = `${this.sessionName}=${val}${this.secureFlag}${this.sessionPath}${this.sessionDomain}`;
  }

  delete() {
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
