import { ServerRequest } from "./deps.ts";
import { UrlEncodedValue, decodeUrlEncoded } from "./utils/urlencoded.ts";
import { parseCookieHeader } from "./utils/cookies.ts";

export class Request {
  public readonly original: ServerRequest;
  query: { [_: string]: UrlEncodedValue | UrlEncodedValue[] } = {};
  params: { [_: string]: UrlEncodedValue | UrlEncodedValue[] } = {};
  body: { [_: string]: any } = {};
  cookies: { [_: string]: string } = {};
  path: string = "";
  relPath: string = "";

  constructor(request: ServerRequest) {
    this.original = request;
  }

  public async _init() {
    return this.parseInit();
  }

  public async parseInit() {
    const regex = /^(.*?)(\?(.*))?$/;
    const [_, regexPath, __, regexQuery] = this.original.url.match(regex) ||
      [undefined, undefined, undefined, undefined];

    // Parse Path
    this.path = regexPath?.replace(/\/$/, "") || "/";
    this.relPath = this.path;

    // Parse Query
    this.query = decodeUrlEncoded(regexQuery || "");

    // Parse Cookies
    let contentType: string | null = null;
    for (const [key, val] of this.original.headers.entries()) {
      if (key === "cookie") {
        this.cookies = { ...this.cookies, ...parseCookieHeader(val) };
      }
      if (key === "content-type") {
        contentType = val;
      }
    }

    // Parse Body
    const mime = contentType?.toLowerCase();
    if (mime?.includes("application/json")) {
      try {
        this.body = JSON.parse(await this.bodyAsString());
      } catch (e) {
        if (!(e instanceof SyntaxError)) {
          throw e;
        }
      }
    }
    if (mime?.includes("application/x-www-form-urlencoded")) {
      this.body = decodeUrlEncoded(await this.bodyAsString());
    }
  }

  public async bodyAsString() {
    return new TextDecoder().decode(await Deno.readAll(this.original.body));
  }
}
