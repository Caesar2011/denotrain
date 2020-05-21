export type CookieValue = string | number | boolean;

export interface CookieStorage {
  getCookies(
    ticket: string,
  ): Promise<{ [key: string]: CookieValue } | undefined>;
  setCookies(
    ticket: string,
    values: { [key: string]: CookieValue },
  ): Promise<void>;

  touch(ticket: string): Promise<void>;
  endSession(ticket: string): Promise<void>;
}
