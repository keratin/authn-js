import { SessionStore } from "./types";
import JWTSession from "./JWTSession";

export default class LocalStorageSessionStore implements SessionStore {
  private readonly sessionName: string;

  constructor(name: string) {
    this.sessionName = name;
  }

  read(): string | undefined {
    return window.localStorage.getItem(this.sessionName) || undefined;
  }

  update(val: string) {
    window.localStorage.setItem(this.sessionName, val);
  }

  delete() {
    window.localStorage.removeItem(this.sessionName);
  }
}
