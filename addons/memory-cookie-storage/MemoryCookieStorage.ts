import { CookieStorage, CookieValue } from "./deps.ts";

export class MemoryCookieStorage implements CookieStorage {
  private readonly cookies: {
    [ticket: string]: { [key: string]: CookieValue };
  } = {};
  private readonly lastTouched: { [ticket: string]: number } = {};

  constructor(private lifespan: number = 1000 * 60 * 60 * 24 * 30) {}

  async getCookies(
    ticket: string,
  ): Promise<{ [key: string]: CookieValue } | undefined> {
    return this.cookies[ticket];
  }

  async setCookies(
    ticket: string,
    values: { [key: string]: CookieValue },
  ): Promise<void> {
    this.init(ticket);
    this.cookies[ticket] = values;
  }

  async touch(ticket: string): Promise<void> {
    this.init(ticket);
    this.lastTouched[ticket] = Date.now();
  }

  async endSession(ticket: string): Promise<void> {
    delete this.cookies[ticket];
    delete this.lastTouched[ticket];
  }

  private init(ticket: string) {
    if (
      !this.cookies.hasOwnProperty(ticket) ||
      this.lastTouched[ticket] + this.lifespan < Date.now()
    ) {
      this.cookies[ticket] = {};
      this.lastTouched[ticket] = Date.now();
    }
  }
}
