'use strict';

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
    return get(url('/accounts/available'), formDataItem('username', username))
      .then((result) => result.available);
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
    const jwt = readCookie(cookieName);
    if (jwt) {
      const claims = jwt_claims(jwt);
      const halflife = (claims.exp - claims.iat) / 2;
      const refreshAt = (claims.iat + halflife) * 1000; // in ms
      const now = (new Date).getTime();

      // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
      // maintaining their session on pretty much every page load.
      if (now < claims.iat || now >= refreshAt) {
        refreshSession(cookieName);
      } else {
        setTimeout(
          () => refreshSession(cookieName),
          refreshAt - now
        );
      }
    }
  }
};

export default KeratinAuthN;

function readCookie(cookieName: string): string | undefined {
  return document.cookie.replace(`(?:(?:^|.*;\s*)${cookieName}\s*\=\s*([^;]*).*$)|^.*$`, "$1");
}

function refreshSession(cookieName: string) {
  KeratinAuthN.refresh().then(
    (id_token) => {
      const secureFlag: string = (window.location.protocol === 'https:') ? '; secure' : ''
      document.cookie = `${cookieName}=${id_token}${secureFlag}`;

      const claims = jwt_claims(id_token);
      const halflife = (claims.exp - claims.iat) / 2;
      setTimeout(
        () => refreshSession(cookieName),
        halflife * 1000
      );
    }
  );
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
          reject('unknown response from server');
        }
      }
    };
    sender(xhr);
  });
}

let inflight: boolean = false;
