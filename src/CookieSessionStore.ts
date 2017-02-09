import JWTSession from "./JWTSession";

export default class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  session: JWTSession | undefined;

  constructor(cookieName: string) {
    this.sessionName = cookieName;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';

    const current = document.cookie.replace(new RegExp(`(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`), "$1");
    if (current) {
      this.session = new JWTSession(current);
    }
  }

  update(val: string) {
    this.session = new JWTSession(val);
    document.cookie = `${this.sessionName}=${val}${this.secureFlag}`;
  }

  delete() {
    this.session = undefined;
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
