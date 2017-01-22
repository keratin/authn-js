export interface Credentials {
  [index: string]: string;
  username: string;
  password: string;
}

export interface JWTClaims {
  iss: string,
  aud: string,
  sub: number,
  iat: number,
  exp: number
}

import { Session } from "./session";

export interface SessionStore {
  session: Session | undefined,
  update(val: string): void,
  delete(): void
}

export interface FormData {
  [index: string]: string | undefined;
}

export interface Error {
  field: string;
  message: string;
}
