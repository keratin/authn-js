import { SessionStore } from "./types";
import { refresh as refreshAPI } from "./api";
import JWTSession from "./JWTSession";

export default class SessionManager {
  private store: SessionStore | undefined;
  private timeoutID: number;

  sessionToken(): string | undefined {
    if (!this.store) {
      return undefined;
    }
    return this.store.read();
  }

  setStore(store: SessionStore): void {
    this.store = store;
  }

  restoreSession(): Promise<void> {
    return new Promise<void>((fulfill, reject) => {
      // configuration error
      if (!this.store) {
        reject();
        return;
      }

      // nothing to restore
      const token = this.sessionToken();
      if (!token) {
        reject();
        return;
      }

      const now = Date.now(); // in ms
      const session = new JWTSession(token);
      const refreshAt = (session.iat() + session.halflife());

      if (isNaN(refreshAt)) {
        this.store.delete();
        throw 'Malformed JWT: can not calculate refreshAt';
      }

      // session looks to be aging or expired.
      //
      // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
      // refreshing their session on pretty much every page load.
      if (now >= refreshAt || now < session.iat()) {
        this.refresh().then(fulfill, reject);
        return;
      }

      // session looks good. keep an eye on it.
      this.scheduleRefresh(refreshAt - now);
      fulfill();
    });
  }

  endSession(): void {
    clearTimeout(this.timeoutID);
    if (this.store) {
      this.store.delete();
    }
  }

  updateAndMaintain(id_token: string): void {
    if (this.store) {
      this.store.update(id_token);
    }
    const session = new JWTSession(id_token);
    this.scheduleRefresh(session.halflife());
  }

  private scheduleRefresh(delay: number): void {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => this.refresh(), delay);
  }

  private refresh(): Promise<void> {
    return refreshAPI().then(
      (id_token) => this.updateAndMaintain(id_token),
      (errors) => {
        if (errors[0] && errors[0].message === 'Unauthorized') {
          this.endSession();
        }
        throw errors;
      }
    );
  }
}
