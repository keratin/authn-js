import JWTSession from "./JWTSession";

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;

  constructor(cookieName: string) {
    this.sessionName = cookieName;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
  }

  read(): string | undefined {
    return document.cookie.replace(new RegExp(`(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`), "$1");
  }

  update(val: string) {
    document.cookie = `${this.sessionName}=${val}${this.secureFlag}`;
  }

  delete() {
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
