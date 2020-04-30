import { contentType, extname, ServerRequest } from "./deps.ts";
import { Body } from "./Router.ts";
import { generateCookieHeader, CookieOptions } from "./utils/cookies.ts";
import { Context } from "./Context.ts";

export class Response {
  public body: Body | null = null;
  public mimeType: string = "";
  public status: number = 200;
  public headers: [string, string][] = [];
  public setCookies: {
    [_: string]: { value: string; options: CookieOptions } | null;
  } = {};
  public respondListener: ((req: Response) => Promise<void>)[] = [];
  private _sent: boolean = false;

  constructor(private ctx: Context<any, any>) {}

  async render(file: string, data: { [_: string]: any } = {}): Promise<void> {
    if (!this.ctx.app.options.viewEngine) {
      throw ReferenceError("No view engine provided!");
    }
    return this.ctx.app.options.viewEngine.render(file, data, this.ctx);
  }

  async file(filePath: string): Promise<boolean> {
    const contType: any = contentType(extname(filePath));
    const fileInfo = await Deno.stat(filePath);
    if (!fileInfo.isFile) {
      return false;
    }
    const file = await Deno.readFile(filePath);
    this
      .setBody(file)
      .setMimeType(contType);
    return true;
  }

  public setBody(body: Body): Response {
    if (this.mimeType === "") {
      if (typeof body === "string") {
        this.mimeType = "text/plain";
      } else if (
        body instanceof Uint8Array || typeof body.read === "function"
      ) {
        this.mimeType = "application/octet-stream";
      } else {
        this.mimeType = "application/json";
      }
    }

    this.body = body;
    return this;
  }

  public setMimeType(mimeType: string): Response {
    this.mimeType = mimeType;
    return this;
  }

  public setStatus(status: number): Response {
    this.status = status;
    return this;
  }

  public addHeader(key: string, value: string): Response {
    this.headers.push([key, value]);
    return this;
  }

  public deleteCookie(key: string): Response {
    this.setCookies[key] = null;
    return this;
  }

  public setCookie(
    key: string,
    value: string,
    options: CookieOptions = {},
  ): Response {
    this.setCookies[key] = { value, options };
    return this;
  }

  public addRespondListener(cb: (res: Response) => Promise<void>): Response {
    this.respondListener.push(cb);
    return this;
  }

  /** @internal */
  public async _respond(): Promise<void> {
    if (this._sent) {
      throw ReferenceError("Already send!");
    }
    if (this.body !== null) {
      await Promise.all(this.respondListener.map((val) => val(this)));
      const cookieHeaders: [string, string][] = [];
      for (const key in this.setCookies) {
        if (this.setCookies.hasOwnProperty(key)) {
          let val = this.setCookies[key] ||
            { value: "", options: { expires: 1000 } };
          cookieHeaders.push(generateCookieHeader(key, val.value, val.options));
        }
      }

      const body: string | Uint8Array | Deno.Reader = (
        this.body instanceof Uint8Array ||
        typeof this.body === "string" ||
        typeof this.body.read === "function"
      )
        ? this.body as string | Uint8Array | Deno.Reader
        : JSON.stringify(this.body);

      await this.ctx.req.original.respond(
        {
          body,
          headers: new Headers(
            [
              ["content-type", this.mimeType],
              ...cookieHeaders,
              ...this.headers,
            ],
          ),
          status: this.status,
        },
      );
      this._sent = true;
    } else {
      throw ReferenceError("Cannot send response without body!");
    }
  }
}
