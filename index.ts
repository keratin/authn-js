'use strict';

import Promise = require('promise');

interface Credentials {
  username: string,
  password: string
}

const AuthAPI = {
  ISSUER: '',

  signup(credentials: Credentials): Promise.IThenable<string> {
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

  isAvailable(username: string): Promise.IThenable<boolean> {
    return get(url('/accounts/available'), formDataItem('username', username))
      .then((result) => result.available);
  },

  login(credentials: Credentials): Promise.IThenable<string> {
    return post(url('/sessions'), formData(credentials))
      .then((result) => result.id_token);
  },
};

export default AuthAPI;

function url(path: string): string {
  if (!AuthAPI.ISSUER.length) {
    throw "AuthAPI.ISSUER not set";
  }
  return `${AuthAPI.ISSUER}${path}`;
}

function formData(credentials: Credentials): string {
  return `${formDataItem('username', credentials.username)}&${formDataItem('password', credentials.password)}`;
}
function formDataItem(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`;
}

function get(url: string, queryString: string): Promise.IThenable<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("GET", `${url}?${queryString}`);
    xhr.send();
  });
}

function post(url: string, formData: string): Promise.IThenable<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formData);
  });
}

function jhr(sender: (xhr: XMLHttpRequest)=>void): Promise.IThenable<any> {
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
    sender(xhr);
  });
}

let inflight: boolean = false;
