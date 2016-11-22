'use strict';

export default (function () {

interface Credentials {
  username: string,
  password: string
}

const KeratinAuthN = {
  ISSUER: '',

  signup(credentials: Credentials): Promise<string> {
    return new Promise((fulfill, reject) => {
      if (inflight) {
        reject("duplicate");
        return;
      } else {
        inflight = true;
      }

      post(url('/accounts'), formData(credentials))
        .then(
          (result) => fulfill(result.id_token),
          (errors) => reject(errors)
        ).then(
          () => inflight = false
        );
    });
  },

  isAvailable(username: string): Promise<boolean> {
    return get(url('/accounts/available'), formDataItem('username', username));
  },

  // If you are building a single-page app and can keep the session token in localStorage, use
  // this function. If your system depends on cookies to maintain session, consider using
  // KeratinAuthN.maintainSession() instead.
  refresh(): Promise<string> {
    return get(url('/sessions/refresh'), '')
      .then((result) => result.id_token);
  },

  login(credentials: Credentials): Promise<string> {
    return post(url('/sessions'), formData(credentials))
      .then((result) => result.id_token);
  },

  // If your system depends on cookies to maintain session, this will keep them up to date. If you
  // are building a single-page app and can keep the session token in localStorage, look instead at
  // KeratinAuthN.refresh().
  maintainSession(cookieName: string): void {
    const manager = new SessionManager(new CookieSessionStore(cookieName));
    if (manager.session.token.length) {
      manager.maintain();
    }
  }
};

class Session {
  readonly token: string;
  readonly claims: JWTClaims;

  constructor(token: string) {
    this.token = token;
    this.claims = jwt_claims(token);
  }

  iat(): number {
    return this.claims.iat;
  }

  exp(): number {
    return this.claims.exp;
  }

  halflife(): number {
    return (this.exp() - this.iat()) / 2;
  }
}

interface SessionStore {
  session: Session,
  update(val: string): void,
  delete(): void
}

class CookieSessionStore {
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

class SessionManager {
  private readonly store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  get session(): Session {
    return this.store.session;
  }

  maintain(): void {
    const refreshAt = (this.session.iat() + this.session.halflife()) * 1000; // in ms
    const now = (new Date).getTime();

    // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
    // maintaining their session on pretty much every page load.
    if (now < this.session.iat() || now >= refreshAt) {
      this.refresh();
    } else {
      setTimeout(
        () => this.refresh(),
        refreshAt - now
      );
    }
  }

  private refresh(): void {
    KeratinAuthN.refresh().then(
      (id_token) => {
        this.store.update(id_token);
        setTimeout(this.refresh, this.session.halflife() * 1000);
      },
      (error) => {
        if (error === 'Unauthorized') {
          this.store.delete();
        }
      }
    );
  }
}

// incomplete but good enough for my needs
interface JWTClaims {
  iat: number,
  exp: number
}

function jwt_claims(jwt: string): JWTClaims {
  return JSON.parse(atob(jwt.split('.')[1]));
}

function url(path: string): string {
  if (!KeratinAuthN.ISSUER.length) {
    throw "KeratinAuthN.ISSUER not set";
  }
  return `${KeratinAuthN.ISSUER}${path}`;
}

function formData(credentials: Credentials): string {
  return `${formDataItem('username', credentials.username)}&${formDataItem('password', credentials.password)}`;
}
function formDataItem(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`;
}

function get(url: string, queryString: string): Promise<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("GET", `${url}?${queryString}`);
    xhr.send();
  });
}

function post(url: string, formData: string): Promise<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formData);
  });
}

function jhr(sender: (xhr: XMLHttpRequest)=>void): Promise<any> {
  return new Promise((fulfill, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // enable authentication server cookies
    xhr.onreadystatechange = () => {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        const data = (xhr.responseText.length > 1) ? JSON.parse(xhr.responseText) : {};
        if (data.result) {
          fulfill(data.result);
        } else if (data.errors) {
          reject(data.errors);
        } else {
          reject(xhr.statusText);
        }
      }
    };
    sender(xhr);
  });
}

let inflight: boolean = false;

return KeratinAuthN;
})();
