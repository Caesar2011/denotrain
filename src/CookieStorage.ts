export type CookieValue = string | number | boolean;

export interface CookieStorage {
  setCookie(ticket: string, key: string, value: CookieValue): Promise<void>;
  deleteCookie(ticket: string, key: string): Promise<void>;
  getCookies(
    ticket: string,
  ): Promise<{ [key: string]: CookieValue } | undefined>;

  touch(ticket: string): Promise<void>;
}
