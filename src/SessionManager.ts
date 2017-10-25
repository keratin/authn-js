import { SessionStore } from "./types";
import { refresh as refreshAPI } from "./api";
import JWTSession from "./JWTSession";

export default class SessionManager {
  private store: SessionStore | undefined;
  private timeoutID: number;
  session: JWTSession | undefined;

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
      const current = this.store.read();
      if (!current) {
        this.session = undefined;
        reject();
        return;
      }

      const session = new JWTSession(current);
      const now = (new Date).getTime();

      // session is viable
      if (now < session.exp()) {
        this.session = session;
        this.maintain();
        fulfill();
      // session is expired (if we trust clocks)
      } else {
        // NOTE: if the client's clock is quite wrong, then each page load will appear logged out
        // until a refresh takes over the timing with setInterval.
        this.session = undefined;
        this.refresh()
          .then(fulfill, reject);
      }
    });
  }

  endSession(): void {
    this.session = undefined;
    clearTimeout(this.timeoutID);
    if (this.store) {
      this.store.delete();
    }
  }

  private maintain(): void {
    if (!this.session) {
      return;
    }

    const refreshAt = (this.session.iat() + this.session.halflife());
    const now = (new Date).getTime(); // in ms

    if (isNaN(refreshAt)) {
      throw 'Malformed JWT: can not calculate refreshAt';
    }

    // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
    // maintaining their session on pretty much every page load.
    if (now < this.session.iat() || now >= refreshAt) {
      this.refresh();
    } else {
      this.scheduleRefresh(refreshAt - now);
    }
  }

  updateAndMaintain(id_token: string): void {
    if (this.store) {
      this.store.update(id_token);
    }
    this.session = new JWTSession(id_token);
    this.scheduleRefresh(this.session.halflife());
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
