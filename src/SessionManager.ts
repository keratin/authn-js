import { refresh as refreshAPI } from "./api";
import JWTSession from "./JWTSession";

export default class SessionManager {
  private store: SessionStore | undefined;
  private timeoutID: number;
  session: JWTSession | undefined;

  setStore(store: SessionStore): void {
    this.store = store;
    const current = store.read();
    this.session = current ? new JWTSession(current) : undefined;
  }

  endSession(): void {
    this.session = undefined;
    if (this.store) {
      this.store.delete();
    }
  }

  maintain(): void {
    if (!this.session) {
      return;
    }

    const refreshAt = (this.session.iat() + this.session.halflife()) * 1000; // in ms
    const now = (new Date).getTime();

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
    this.scheduleRefresh(this.session.halflife() * 1000);
  }

  private scheduleRefresh(delay: number): void {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => this.refresh(), delay);
  }

  private refresh(): void {
    refreshAPI().then(
      (id_token) => this.updateAndMaintain(id_token),
      (error) => {
        if (error === 'Unauthorized') {
          this.endSession();
        }
      }
    );
  }
}
