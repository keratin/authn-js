import { SessionStore } from "./types";
import { refresh as refreshAPI } from "./api";
import JWTSession from "./JWTSession";

export default class SessionManager {
  private store: SessionStore | undefined;
  private refreshAt: number | undefined;
  private timeoutID: ReturnType<typeof setTimeout> | undefined;

  // immediately hook into visibility changes. strange things can happen to timeouts while a device
  // is asleep, so we want to reset them.
  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.scheduleRefresh();
        }
      });
    }
  }

  setStore(store: SessionStore): void {
    this.store = store;
  }

  // read from the store
  sessionToken(): string | undefined {
    if (!this.store) {
      return undefined;
    }
    return this.store.read();
  }

  // write to the store
  update(id_token: string): void {
    if (!this.store) {
      return;
    }
    const session = new JWTSession(id_token);
    this.store.update(id_token, session.exp());
    this.refreshAt = Date.now() + session.halflife();
    this.scheduleRefresh();
  }

  // delete from the store
  endSession(): void {
    this.refreshAt = undefined;
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
    }
    if (this.store) {
      this.store.delete();
    }
  }

  // restoreSession runs an immediate token refresh and fulfills a promise if the session looks
  // alive. note that this is no guarantee, because of potentially bad client clocks.
  // TODO: change API to return a boolean and only reject in exceptional situations
  restoreSession(): Promise<void> {
    return new Promise<void>((fulfill, reject) => {
      // configuration error
      if (!this.store) {
        reject("No session storage available.");
        return;
      }

      // nothing to restore
      const token = this.sessionToken();
      if (!token) {
        reject("No session.");
        return;
      }

      const now = Date.now(); // in ms
      const session = new JWTSession(token);
      const refreshAt = session.iat() + session.halflife();

      if (isNaN(refreshAt)) {
        this.store.delete();
        reject("Malformed JWT: can not calculate refreshAt");
        return;
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
      this.refreshAt = refreshAt;
      this.scheduleRefresh();
      fulfill();
    });
  }

  refresh(): Promise<void> {
    return refreshAPI().then(
      (id_token) => this.update(id_token),
      (errors) => {
        if (errors[0] && errors[0].message === "401") {
          this.endSession();
        }
        throw errors;
      }
    );
  }

  private scheduleRefresh(): void {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
    }
    if (this.refreshAt) {
      this.timeoutID = setTimeout(
        () =>
          this.refresh().catch((errors) => {
            // these errors have already been handled and are only propagating from `refresh` to
            // keep its contract with restoreSession, which depends on rejecting to indicate there
            // is no session.
            if (errors[0] && errors[0].message === "401") {
              return;
            }
            throw errors;
          }),
        this.refreshAt - Date.now()
      );
    }
  }
}
