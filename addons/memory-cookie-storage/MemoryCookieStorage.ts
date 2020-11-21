import { SessionStorage, SessionValue } from "./deps.ts";

export class MemoryCookieStorage implements SessionStorage {
  private readonly cookies: {
    [ticket: string]: { [key: string]: SessionValue };
  } = {};
  private readonly lastTouched: { [ticket: string]: number } = {};

  constructor(private lifespan: number = 1000 * 60 * 60 * 24 * 30) {}

  async getSession(
    ticket: string,
  ): Promise<{ [key: string]: SessionValue } | undefined> {
    return this.cookies[ticket];
  }

  async setSession(
    ticket: string,
    values: { [key: string]: SessionValue },
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
