import { Session } from "./session";
import { SessionStore } from "./session_store";

export class CookieSessionStore implements SessionStore {
  private readonly sessionName: string;
  private readonly secureFlag: string;
  session: Session;

  constructor(cookieName: string) {
    this.sessionName = cookieName;
    this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
    this.session = new Session(
      document.cookie.replace(`(?:(?:^|.*;\s*)${this.sessionName}\s*\=\s*([^;]*).*$)|^.*$`, "$1")
    );
  }

  update(val: string) {
    this.session = new Session(val);
    document.cookie = `${this.sessionName}=${val}${this.secureFlag}`;
  }

  delete() {
    document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
