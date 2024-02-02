/*
 * Bare API methods have no local side effects (unless you count debouncing).
 */

import { Credentials, KeratinError, OtpData } from "./types";
import { get, post, del } from "./verbs";

// TODO: extract debouncing
let inflight: boolean = false;

let ISSUER: string = "";
export function setHost(URL: string): void {
  ISSUER = URL.replace(/\/$/, "");
}

interface TokenResponse {
  id_token: string;
}

export function signup(credentials: Credentials): Promise<string> {
  return new Promise(
    (
      fulfill: (data: string) => any,
      reject: (errors: KeratinError[]) => any
    ) => {
      if (inflight) {
        reject([{ message: "duplicate" }]);
        return;
      } else {
        inflight = true;
      }

      post<TokenResponse>(url("/accounts"), credentials)
        .then(
          (result) => fulfill(result.id_token),
          (errors) => reject(errors)
        )
        .then(() => (inflight = false));
    }
  );
}

function isTaken(e: KeratinError) {
  return e.field === "username" && e.message === "TAKEN";
}

export function isAvailable(username: string): Promise<boolean> {
  return get<boolean>(url("/accounts/available"), { username })
    .then((bool) => bool)
    .catch((e: Error | KeratinError[]) => {
      if (!(e instanceof Error) && e.some(isTaken)) {
        return false;
      }
      throw e;
    });
}

export function refresh(): Promise<string> {
  return get<TokenResponse>(url("/session/refresh"), {}).then(
    (result) => result.id_token
  );
}

export function login(credentials: Credentials): Promise<string> {
  return post<TokenResponse>(url("/session"), credentials).then(
    (result) => result.id_token
  );
}

export function logout(): Promise<void> {
  return del<void>(url("/session"));
}

export function requestPasswordReset(username: string): Promise<void> {
  return get<void>(url("/password/reset"), { username });
}

export function changePassword(args: {
  password: string;
  currentPassword: string;
}): Promise<string> {
  return post<TokenResponse>(url("/password"), args).then(
    (result) => result.id_token
  );
}

export function resetPassword(args: {
  password: string;
  token: string;
}): Promise<string> {
  return post<TokenResponse>(url("/password"), args).then(
    (result) => result.id_token
  );
}

export function requestSessionToken(username: string): Promise<void> {
  return get<void>(url("/session/token"), { username });
}

export function sessionTokenLogin(credentials: {
  token: string;
}): Promise<string> {
  return post<TokenResponse>(url("/session/token"), credentials).then(
    (result) => result.id_token
  );
}

export function newTOTP(): Promise<OtpData> {
  return post<OtpData>(url("/totp/new"), {}).then((result: OtpData) => result);
}

export function confirmTOTP(req: { otp: string }): Promise<boolean> {
  return post<void>(url("/totp/confirm"), req)
    .then(() => true)
    .catch(() => false);
}

export function deleteTOTP(): Promise<boolean> {
  return del<void>(url("/totp"))
    .then(() => true)
    .catch(() => false);
}

export function beginOAuthUrl(providerName: string): string {
  return url(`/oauth/${providerName}`);
}

function url(path: string): string {
  if (!ISSUER.length) {
    throw "ISSUER not set";
  }
  return `${ISSUER}${path}`;
}
