import { ServerRequest, v4 } from "./deps.ts";
import { Application } from "./Application.ts";
import { Response } from "./Response.ts";
import { Request } from "./Request.ts";
import { CookieStorage, CookieValue } from "./CookieStorage.ts";

export class Context<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> {
  public readonly res: Response = new Response(this);
  public readonly req: Request;
  public data: R = {} as R;

  public cookies: { [key: string]: CookieValue } = {};
  private cookiesBefore: { [key: string]: CookieValue } = {};
  private ticket: string = "";
  public error: any;

  constructor(request: ServerRequest, public readonly app: Application<S, R>) {
    this.req = new Request(request);
  }

  async _init() {
    this.req._init();
    const cookieKey = this.app.options.cookieKey;
    const ticket = this.req.cookies[cookieKey] || null;
    if (!ticket) {
      this.ticket = v4.generate();
      this.res.setCookie(
        cookieKey,
        this.ticket,
        this.app.options.cookieOptions,
      );
    } else {
      this.ticket = ticket;
      this.cookiesBefore =
        await this.app.options.cookieStorage.getCookies(ticket) ?? {};
      await this.app.options.cookieStorage.touch(ticket);
    }
    this.cookies = { ...this.cookiesBefore };
  }

  async _respond() {
    this.res._respond();

    for (const key in this.cookies) {
      if (
        this.cookies.hasOwnProperty(key) &&
        this.cookies[key] !== this.cookiesBefore[key]
      ) {
        // update/add
        await this.app.options.cookieStorage.setCookie(
          this.ticket,
          key,
          this.cookies[key],
        );
      }
    }

    for (const key in this.cookiesBefore) {
      if (
        this.cookiesBefore.hasOwnProperty(key) &&
        !this.cookies.hasOwnProperty(key)
      ) {
        // delete
        await this.app.options.cookieStorage.deleteCookie(this.ticket, key);
      }
    }
  }
}
