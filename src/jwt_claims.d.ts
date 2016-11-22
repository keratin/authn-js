export interface JWTClaims {
  iss: string,
  aud: string,
  sub: number,
  iat: number,
  exp: number
}
