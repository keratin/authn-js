/*
 * Bare API methods have no local side effects (unless you count debouncing).
 */

import { Credentials, KeratinError, OtpData } from "./types";
import { get, post, del } from "./verbs";

interface TokenResponse {
  id_token: string;
}

export default class API {
  // TODO: extract debouncing
  private inflight: boolean = false;

  private ISSUER: string;

  constructor(ISSUER: string) {
    this.setHost(ISSUER);
  }

  setHost = (URL: string): void => {
    this.ISSUER = URL.replace(/\/$/, "");
  }

  signup = (credentials: Credentials): Promise<string> => {
    return new Promise(
      (
        fulfill: (data: string) => any,
        reject: (errors: KeratinError[]) => any
      ) => {
        if (this.inflight) {
          reject([{ message: "duplicate" }]);
          return;
        } else {
          this.inflight = true;
        }

        post<TokenResponse>(this.url("/accounts"), credentials)
          .then(
            (result) => fulfill(result.id_token),
            (errors) => reject(errors)
          )
          .then(() => (this.inflight = false));
      }
    );
  }

  isAvailable = (username: string): Promise<boolean> => {
    return get<boolean>(this.url("/accounts/available"), { username })
      .then((bool) => bool)
      .catch((e: Error | KeratinError[]) => {
        if (!(e instanceof Error) && e.some(this.isTaken)) {
          return false;
        }
        throw e;
      });
  }

  refresh = (): Promise<string> => {
    return get<TokenResponse>(this.url("/session/refresh"), {}).then(
      (result) => result.id_token
    );
  }

  login = (credentials: Credentials): Promise<string> => {
    return post<TokenResponse>(this.url("/session"), credentials).then(
      (result) => result.id_token
    );
  }

  logout = (): Promise<void> => {
    return del<void>(this.url("/session"));
  }

  requestPasswordReset = (username: string): Promise<void> => {
    return get<void>(this.url("/password/reset"), { username });
  }

  changePassword = (args: {
    password: string;
    currentPassword: string;
  }): Promise<string> => {
    return post<TokenResponse>(this.url("/password"), args).then(
      (result) => result.id_token
    );
  }

  resetPassword = (args: {
    password: string;
    token: string;
  }): Promise<string> => {
    return post<TokenResponse>(this.url("/password"), args).then(
      (result) => result.id_token
    );
  }

  requestSessionToken = (username: string): Promise<void> => {
    return get<void>(this.url("/session/token"), { username });
  }

  sessionTokenLogin = (credentials: {
    token: string;
  }): Promise<string> => {
    return post<TokenResponse>(this.url("/session/token"), credentials).then(
      (result) => result.id_token
    );
  }

  newTOTP = (): Promise<OtpData> => {
    return post<OtpData>(this.url("/totp/new"), {}).then((result: OtpData) => result);
  }

  confirmTOTP = (req: { otp: string }): Promise<boolean> => {
    return post<void>(this.url("/totp/confirm"), req)
      .then(() => true)
      .catch(() => false);
  }

  deleteTOTP = (): Promise<boolean> => {
    return del<void>(this.url("/totp"))
      .then(() => true)
      .catch(() => false);
  }

  beginOAuthUrl = (providerName: string, redirectUri: string): string => {
    let redirectUriParam = encodeURIComponent(redirectUri);
    return this.url(`/oauth/${providerName}?redirect_uri=${redirectUriParam}`);
  }

  private url = (path: string): string => {
    if (!this.ISSUER.length) {
      throw "ISSUER not set";
    }
    return `${this.ISSUER}${path}`;
  }

  private isTaken(e: KeratinError) {
    return e.field === "username" && e.message === "TAKEN";
  }
}
