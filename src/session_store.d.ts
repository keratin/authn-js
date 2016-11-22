import { Session } from "./session";

export interface SessionStore {
  session: Session | undefined,
  update(val: string): void,
  delete(): void
}
