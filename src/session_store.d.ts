import { Session } from "./session";

export interface SessionStore {
  session: Session,
  update(val: string): void,
  delete(): void
}
