import JWTSession from "./JWTSession";

export default class MemorySessionStore implements SessionStore {
  session: JWTSession | undefined;

  update(val: string) {
    this.session = new JWTSession(val);
  }

  delete() {
    this.session = undefined;
  }
}
