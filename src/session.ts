export class Session {
  readonly token: string;
  readonly claims: JWTClaims;

  constructor(token: string) {
    this.token = token;
    this.claims = jwt_claims(token);
  }

  iat(): number {
    return this.claims.iat;
  }

  exp(): number {
    return this.claims.exp;
  }

  halflife(): number {
    return (this.exp() - this.iat()) / 2;
  }
}

function jwt_claims(jwt: string): JWTClaims {
  return JSON.parse(atob(jwt.split('.')[1]));
}
