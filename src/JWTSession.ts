import { Session, JWTClaims } from "./types";

export default class JWTSession implements Session {
  readonly token: string;
  readonly claims: JWTClaims;

  constructor(token: string) {
    this.token = token;
    this.claims = jwt_claims(token);
  }

  iat() {
    return this.claims.iat * 1000;
  }

  exp() {
    return this.claims.exp * 1000;
  }

  halflife() {
    return (this.exp() - this.iat()) / 2;
  }
}

function jwt_claims(jwt: string): JWTClaims {
  try {
    return JSON.parse(atob(jwt.split('.')[1]));
  } catch(e) {
    throw 'Malformed JWT: invalid encoding'
  }
}
