import { ServerRequest } from "./deps.ts";
import { UrlEncodedValue, decodeUrlEncoded } from "./utils/urlencoded.ts";
import { parseCookieHeader } from "./utils/cookies.ts";

export class Request {
  public readonly original: ServerRequest;
  readonly query: { [_: string]: UrlEncodedValue | UrlEncodedValue[] } = {};
  param: { [_: string]: UrlEncodedValue | UrlEncodedValue[] } = {};
  readonly body: { [_: string]: any } = {};
  readonly cookies: { [_: string]: string } = {};
  readonly path: string = "";
  relPath: string = "";

  constructor(request: ServerRequest) {
    this.original = request;
    const regex = /^(.*?)(\?(.*))?$/;
    const [_, regexPath, __, regexQuery] = request.url.match(regex) ||
      [undefined, undefined, undefined, undefined];

    // Parse Path
    this.path = regexPath?.replace(/\/$/, "") || "/";
    this.relPath = this.path;

    // Parse Query
    this.query = decodeUrlEncoded(regexQuery || "");

    // Parse Cookies
    for (const [key, val] of request.headers.entries()) {
      if (key === "cookie") {
        this.cookies = { ...this.cookies, ...parseCookieHeader(val) };
      }
    }

    // Parse Body
    // TODO
  }
}
