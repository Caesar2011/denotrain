import { ServerRequest, v4, SHA256 } from "../deps.ts";
import { Application } from "./Application.ts";
import { Response } from "./Response.ts";
import { Request } from "./Request.ts";
import { CookieValue } from "./CookieStorage.ts";

export class Context<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> {
  public readonly res: Response = new Response(this);
  public readonly req: Request;
  public data: R = {} as R;

  public cookies: { [key: string]: CookieValue } = {};
  private ticket: string | null = null;
  public error: any;

  constructor(request: ServerRequest, public readonly app: Application<S, R>) {
    this.req = new Request(request);
  }

  async endSession() {
    if (this.ticket !== null) {
      await this.app.options.cookieStorage.endSession(this.ticket);
    }
    this.ticket = null;
    this.cookies = {};
  }

  async _init() {
    await this.req._init();

    const cookieKey = this.app.options.cookieKey;
    const ticket = this.req.cookies[cookieKey] || null;
    if (!ticket || !this.validateTicket(ticket)) {
      this.ticket = null;
    } else {
      this.ticket = ticket;
      const cookies = await this.app.options.cookieStorage.getCookies(ticket);
      this.cookies = { ...cookies };
      await this.app.options.cookieStorage.touch(ticket);
    }
  }

  private async generateTicket(): Promise<string> {
    const salt = v4.generate();
    const secret = this.app.options.cookieSecret;
    const hash = await new SHA256().update(secret + "$" + salt).digest(
      "base64",
    );
    return hash + "$" + salt;
  }

  private async validateTicket(str: string): Promise<boolean> {
    const secret = this.app.options.cookieSecret;
    const salt = str.substring(str.indexOf("$") + 1);
    const check = str.substring(0, str.indexOf("$"));
    const hash = await new SHA256().update(secret + "$" + salt).digest(
      "base64",
    );
    return check === hash;
  }

  private async getTicket(): Promise<string> {
    if (this.ticket === null) {
      this.ticket = await this.generateTicket();
    }
    return this.ticket;
  }

  async _prepareResponse() {
    if (Object.keys(this.cookies).length > 0) {
      const cookieKey = this.app.options.cookieKey;
      this.res.setCookie(
        cookieKey,
        await this.getTicket(),
        this.app.options.cookieOptions,
      );
    }

    await this.res._prepareResponse();
  }

  async _respond() {
    this.res._respond();

    if (Object.keys(this.cookies).length > 0) {
      await this.app.options.cookieStorage.setCookies(
        await this.getTicket(),
        this.cookies,
      );
    }
  }
}
