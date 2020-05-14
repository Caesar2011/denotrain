export type CookieValue = string | number | boolean;

export interface CookieStorage {
  setCookie(ticket: string, key: string, value: CookieValue): Promise<void>;
  deleteCookie(ticket: string, key: string): Promise<void>;
  getCookies(
    ticket: string,
  ): Promise<{ [key: string]: CookieValue } | undefined>;

  touch(ticket: string): Promise<void>;
}

export class MemoryCookieStorage implements CookieStorage {
  private readonly cookies: {
    [ticket: string]: { [key: string]: CookieValue };
  } = {};
  private readonly lastTouched: { [ticket: string]: number } = {};

  constructor(private lifespan: number = 1000 * 60 * 60 * 24 * 30) {
    setInterval(() => {
      const now = Date.now();
      for (const ticket in this.lastTouched) {
        if (
          this.lastTouched.hasOwnProperty(ticket) &&
          this.lastTouched[ticket] + this.lifespan < now
        ) {
          delete this.lastTouched[ticket];
          delete this.cookies[ticket];
        }
      }
    }, 60 * 60 * 1000);
  }

  async setCookie(
    ticket: string,
    key: string,
    value: CookieValue,
  ): Promise<void> {
    this.init(ticket);
    this.cookies[ticket][key] = value;
  }

  async deleteCookie(ticket: string, key: string): Promise<void> {
    if (this.cookies.hasOwnProperty(ticket)) {
      delete this.cookies[ticket][key];
    }
  }

  async getCookies(
    ticket: string,
  ): Promise<{ [key: string]: CookieValue } | undefined> {
    return this.cookies[ticket];
  }

  async touch(ticket: string): Promise<void> {
    this.init(ticket);
    this.lastTouched[ticket] = Date.now();
  }

  private init(ticket: string) {
    if (!this.cookies.hasOwnProperty(ticket)) {
      this.cookies[ticket] = {};
      this.lastTouched[ticket] = Date.now();
    }
  }
}
