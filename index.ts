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
  signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string>,
  post(url: string, formData: string): Promise.IThenable<any>
}

const AuthAPI = {
  ISSUER: '',
  inflight: false,

  accounts_url(this: AuthAPI): string {
    if (!this.ISSUER.length) {
      throw "AuthAPI.ISSUER not set";
    }
    return `${this.ISSUER}/accounts`;
  },

  signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string> {
    const formData: string = `username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

    return new Promise((fulfill, reject) => {
      if (this.inflight) {
        reject("duplicate");
        return;
      } else {
        this.inflight = true;
      }

      this.post(this.accounts_url(), formData)
        .then(
          (result) => fulfill(result.id_token),
          (errors) => reject(errors)
        ).then(
          () => this.inflight = false
        );
    });
  },

  post(url: string, formData: string): Promise.IThenable<any> {
    return new Promise((fulfill, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          const data = JSON.parse(xhr.responseText);
          if (data.result) {
            fulfill(data.result);
          } else if (data.errors) {
            reject(data.errors);
          } else {
            reject('unknown response from server');
          }
        }
      };
      xhr.open("POST", url);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(formData);
    });
  }
};

export default AuthAPI;
