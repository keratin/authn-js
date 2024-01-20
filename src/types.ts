export interface Credentials {
  [index: string]: string | undefined;
  username: string;
  otp?: string;
  password: string;
}

export interface KeratinError {
  field?: string;
  message: string;
}

export interface JWTClaims {
  iss: string;
  aud: string;
  sub: number;
  iat: number;
  exp: number;
}

export declare class Session {
  readonly token: string;
  readonly claims: JWTClaims;

  constructor(token: string);

  iat(): number;

  exp(): number;

  halflife(): number;
}

export interface SessionStore {
  read(): string | undefined;
  update(val: string, exp: number | undefined): void;
  delete(): void;
}

export interface StringMap {
  [index: string]: string | undefined;
}

export interface OtpData {
  secret: string;
  url: string;
}
