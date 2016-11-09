'use strict';

import Promise = require('promise');

interface Credentials {
  username: string,
  password: string
}

interface AuthAPI {
  ISSUER: string,
  inflight: boolean,
  signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string>,
  login(this: AuthAPI, credentials: Credentials): Promise.IThenable<string>,
}

const AuthAPI = {
  ISSUER: '',

  signup(this: AuthAPI, credentials: Credentials): Promise.IThenable<string> {
    return new Promise((fulfill, reject) => {
      if (inflight) {
        reject("duplicate");
        return;
      } else {
        inflight = true;
      }

      post(accounts_url(), formData(credentials))
        .then(
          (result) => fulfill(result.id_token),
          (errors) => reject(errors)
        ).then(
          () => inflight = false
        );
    });
  },

  login(this: AuthAPI, credentials: Credentials): Promise.IThenable<string> {
    return post(sessions_url(), formData(credentials))
      .then((result) => result.id_token);
  },
};

export default AuthAPI;

function accounts_url(): string {
  if (!AuthAPI.ISSUER.length) {
    throw "AuthAPI.ISSUER not set";
  }
  return `${AuthAPI.ISSUER}/accounts`;
}

function sessions_url(): string {
  if (!AuthAPI.ISSUER.length) {
    throw "AuthAPI.ISSUER not set";
  }
  return `${AuthAPI.ISSUER}/sessions`;
}

function formData(credentials: Credentials): string {
  return `username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;
}

function post(url: string, formData: string): Promise.IThenable<any> {
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

let inflight: boolean = false;
