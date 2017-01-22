import { get, post } from "./verbs";
import { Credentials, Error } from "./types";

let inflight: boolean = false;

let ISSUER: string = '';

export function setHost(URL: string): void {
  ISSUER = URL.replace(/\/$/, '');
}

interface TokenResponse{
  id_token: string;
}

export function signup(credentials: Credentials): Promise<string> {
  return new Promise((
    fulfill: (data?: string) => any,
    reject: (errors: Error[]) => any
  ) => {
    if (inflight) {
      reject([{field: '', message: "duplicate"}]);
      return;
    } else {
      inflight = true;
    }

    post<TokenResponse>(url('/accounts'), credentials)
      .then(
        (result) => fulfill(result.id_token),
        (errors) => reject(errors)
      ).then(
        () => inflight = false
      );
  });
}

export function isAvailable(username: string): Promise<boolean> {
  return get<boolean>(url('/accounts/available'), {username});
}

export function refresh(): Promise<string> {
  return get<TokenResponse>(url('/sessions/refresh'), {})
    .then((result) => result.id_token);
}

export function login(credentials: Credentials): Promise<string> {
  return post<TokenResponse>(url('/sessions'), credentials)
    .then((result) => result.id_token);
}

export function logout(): Promise<{}> {
  return new Promise(function(fulfill) {
    let iframe = document.createElement('iframe');
    iframe.onload = () => {
      iframe.remove();
      fulfill();
    };
    iframe.src = url('/sessions/logout');

    const style = iframe.style;
    style.height = '0';
    style.width = '0';
    style.border = '0';

    document.querySelector('body').appendChild(iframe);
  });
}

export function requestPasswordReset(username: string): Promise<{}> {
  return get(url('/password/reset'), {username});
}

export function changePassword(args: {password: string, token?: string}): Promise<string> {
  return post<TokenResponse>(url('/password'), args)
    .then((result) => result.id_token);
}

function url(path: string): string {
  if (!ISSUER.length) {
    throw "ISSUER not set";
  }
  return `${ISSUER}${path}`;
}
