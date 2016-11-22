'use strict';

import { get, post } from "./verbs";

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

  refresh(): Promise<string> {
    return get(url('/sessions/refresh'), '')
      .then((result) => result.id_token);
  },

  login(credentials: Credentials): Promise<string> {
    return post(url('/sessions'), formData(credentials))
      .then((result) => result.id_token);
  }
};

export default KeratinAuthN;

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

let inflight: boolean = false;
