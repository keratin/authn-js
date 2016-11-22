import { Session } from "./session";
import { SessionStore } from "./session_store";
import { refresh as refreshAPI } from "./api";

export class SessionManager {
  private readonly store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  get session(): Session | undefined {
    return this.store.session;
  }

  sessionIsActive(): boolean {
    if (!this.session) { return false }
    return this.session.token.length > 0;
  }

  maintain(): void {
    if (!this.session || !this.sessionIsActive()) {
      return;
    }

    const refreshAt = (this.session.iat() + this.session.halflife()) * 1000; // in ms
    const now = (new Date).getTime();

    // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
    // maintaining their session on pretty much every page load.
    if (now < this.session.iat() || now >= refreshAt) {
      this.refresh();
    } else {
      setTimeout(
        () => this.refresh(),
        refreshAt - now
      );
    }
  }

  private refresh(): void {
    refreshAPI().then(
      (id_token) => {
        this.store.update(id_token);
        if (this.session) {
          setTimeout(this.refresh, this.session.halflife() * 1000);
        }
      },
      (error) => {
        if (error === 'Unauthorized') {
          this.store.delete();
        }
      }
    );
  }
}
