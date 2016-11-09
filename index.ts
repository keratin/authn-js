'use strict';

import Promise = require('promise');

interface Credentials {
  username: string,
  password: string
}

interface AuthAPI {
  ISSUER: string,
  inflight: boolean,
  accounts_url(this: AuthAPI): string,
  signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string>
}

export const AuthAPI = {
  ISSUER: '',
  inflight: false,

  accounts_url: function accounts_url(this: AuthAPI): string {
    if (!this.ISSUER.length) {
      throw "AuthAPI.ISSUER not set";
    }
    return `${this.ISSUER}/accounts`;
  },

  signup: function signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string> {
    const formData: string = `username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

    return new Promise((fulfill, reject) => {
      if (this.inflight) {
        reject("duplicate");
        return;
      } else {
        this.inflight = true;
      }

      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          const data = JSON.parse(xhr.responseText);
          if (data.result) {
            fulfill(data.result.id_token);
          } else if (data.errors) {
            reject(data.errors);
          } else {
            reject('unknown response from server');
          }
          this.inflight = false;
        }
      };
      xhr.open("POST", this.accounts_url());
      xhr.send(formData);
    });
  }
};
