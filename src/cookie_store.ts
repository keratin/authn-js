import { Session } from "./session";

export class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  session: Session|undefined;

  constructor(cookieName: string) {
    this.sessionName = cookieName;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';

    const current = document.cookie.replace(new RegExp(`(?:(?:^|.*;\\\s*)${this.sessionName}\\\s*\\\=\\\s*([^;]*).*$)|^.*$`), "$1");
    if (current) {
      this.session = new Session(current);
    }
  }

  update(val: string) {
    this.session = new Session(val);
    document.cookie = `${this.sessionName}=${val}${this.secureFlag}`;
  }

  delete() {
    this.session = undefined;
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
