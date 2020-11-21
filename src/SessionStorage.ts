export type SessionValue = string | number | boolean;

export interface SessionStorage {
  getSession(
    ticket: string,
  ): Promise<{ [key: string]: SessionValue } | undefined>;
  setSession(
    ticket: string,
    values: { [key: string]: SessionValue },
  ): Promise<void>;

  touch(ticket: string): Promise<void>;
  endSession(ticket: string): Promise<void>;
}
