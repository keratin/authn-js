interface Credentials {
  [index: string]: string;
  username: string;
  password: string;
}

interface JWTClaims {
  iss: string,
  aud: string,
  sub: number,
  iat: number,
  exp: number
}

declare class Session {
  readonly token: string;
  readonly claims: JWTClaims;

  constructor(token: string);
  iat(): number;
  exp(): number;
  halflife(): number;
}

interface SessionStore {
  session: Session | undefined,
  update(val: string): void,
  delete(): void
}

interface PasswordResetArgs {
  [index: string]: string;
  password: string;
  resetToken: string;
}
