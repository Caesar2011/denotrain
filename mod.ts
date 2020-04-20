import { serve, ServerRequest } from './deps.ts'
import { decodeUrlEncoded, UrlEncodedValue, parseValue } from './utils/urlencoded.ts'
import { parseCookieHeader, generateCookieHeader, CookieOptions } from './utils/cookies.ts'

export class Router {
  private handlers: HandlerEntry[] = [];

  public add(path: string|RegExp|null|RequestHandler, method: string|null, ...handlers: RequestHandler[]) {
    if (instanceOfRequestHandler(path)) {
      this.handlers.push(this.generateHandlerEntry(null, null, path));
      path = null;
    }
    for (const handler of handlers) {
      this.handlers.push(this.generateHandlerEntry(path, null, handler));
    }
  }

  public use(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public use(...handlers: RequestHandler[]): void;
  public use(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, null, ...handlers);
  }

  public get(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public get(...handlers: RequestHandler[]): void;
  public get(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "GET", ...handlers);
  }

  public head(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public head(...handlers: RequestHandler[]): void;
  public head(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "HEAD", ...handlers);
  }

  public post(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public post(...handlers: RequestHandler[]): void;
  public post(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "POST", ...handlers);
  }

  public put(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public put(...handlers: RequestHandler[]): void;
  public put(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "PUT", ...handlers);
  }

  public delete(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public delete(...handlers: RequestHandler[]): void;
  public delete(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "DELETE", ...handlers);
  }

  public patch(path: string|RegExp|null, ...handlers: RequestHandler[]): void;
  public patch(...handlers: RequestHandler[]): void;
  public patch(path: string|RegExp|null|RequestHandler, ...handlers: RequestHandler[]): void {
    this.add(path, "PATCH", ...handlers);
  }

  public async handle(req: Request): Promise<RequestHandlerSuccess> {
    let result: RequestHandlerSuccess = undefined;
    for (const handler of this.handlers) {
      const relPath: string|null = this.matchPath(req, handler);
      const oldRelPath: string = req.relPath;
      if (relPath) {
        req.relPath = relPath;
        if (handler.handler instanceof Router) {
          result = await handler.handler.handle(req);
        } else {
          result = await handler.handler(req);
        }
        req.relPath = oldRelPath;
        if (result !== undefined) {
          return result;
        }
      }
    }
    return undefined;
  }

  private generateHandlerEntry(path: string|RegExp|null, method: RequestMethod|null, handler: RequestHandler): HandlerEntry {
    if (typeof path == 'string') {
      const paramMatches = path.matchAll(/\/:([a-z]+)/g);
      const params: string[] = [];
      for (const match of paramMatches) {
        params.push(match[1]);
      }
      path = path
        .replace(/(.)\/$/, "$1")
        .replace(/\/:([a-z]+)/g, "/([0-9a-zA-Z]+)");
      const regex = (handler instanceof Router) ? new RegExp(`^${path}`) : new RegExp(`^${path}$`);
      return {regex, params, method, handler};
    } else {
      return {regex: path, params: [], method, handler};
    }
  }

  private matchPath(req: Request, handler: HandlerEntry): string|null {
    if (!handler.regex) {
      return req.relPath || "/";
    }
    if (handler.method && handler.method !== req.req.method)
      return null;
    const match = req.relPath.match(handler.regex);
    if (match) {
      req.relPath.substring(match[0].length) || "/";
      for (var member in req.param) delete req.param[member];
      for (let i = 0; i < handler.params.length; i++) {
        req.param[handler.params[i]] = parseValue(match[i+1]);
      }
      return req.relPath.substring(match[0].length) || "/";;
    } else {
      return null;
    }
  }
}

export class Server extends Router {
  private options: ServerParameters;

  constructor(options: ServerOptions) {
    super();
    const defs = {port: 3000};
    this.options = {...defs, ...options};
  }

  public async run() {
    const s = serve({ port: this.options.port });
    console.log(`Serving on http://localhost:${this.options.port}/`);
    for await (const req of s) {
      this.handleRequest(new Request(req));
    }
  }

  private async handleRequest(req: Request): Promise<void> {
    try {
      const result = await this.handle(req);
      if (result !== undefined) {
        const response: ClientSuccess = req.response;
        if (result !== true) {
          response.setBody(result);
        }
        await response._respond(req);
        return;
      }
    } catch (e) {
      if (e instanceof ClientError) {
        await req.req.respond({ status: e.statusCode, body: e.message });
        return;
      } else {
        await req.req.respond({ status: 500, body: "Internal server error!" });
      }
    }
    await req.req.respond({ status: 404, body: `Requested route ${req.req.url} not found!` });
  }

}

type JSONSuccess = {[_: string]: any};
export type RequestHandler = Router | ((req: Request) => (Promise<RequestHandlerSuccess> | RequestHandlerSuccess));
export type RequestHandlerSuccess = true|string|JSONSuccess|null|void;
function instanceOfRequestHandler(object: any): object is RequestHandler {
  return object instanceof Router || typeof object === 'function';
}

type HandlerEntry = {regex: RegExp|null, params: string[], method: RequestMethod|null, handler: RequestHandler};

export class Request {
  readonly query: {[_: string]: UrlEncodedValue|UrlEncodedValue[]} = {};
  readonly param: {[_: string]: UrlEncodedValue|UrlEncodedValue[]} = {};
  readonly body: {[_: string]: any} = {};
  readonly cookies: {[_: string]: string} = {};
  readonly path: string = "";
  relPath: string = "";
  readonly response: ClientSuccess = new ClientSuccess();

  constructor(public req: ServerRequest) {
    this.req.url = req.url;
    this.req.respond = req.respond;
    const regex = /^(.*?)(\?(.*))?$/;
    const match = req.url.match(regex) || [undefined, undefined, undefined, undefined];
    this.path = match && match[1] && match[1].replace(/\/$/, "") || "/";
    this.relPath = this.path;
    this.query = decodeUrlEncoded(match && match[3] || "");

    for (const [key, val] of req.headers.entries()) {
      if (key === 'cookie') {
        this.cookies = {...this.cookies, ...parseCookieHeader(val)};
      }
    }
  }
}

export class ClientError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}

export class ClientSuccess {

  public body: Uint8Array | Deno.Reader | string | null = null;
  public mimeType: string = "";
  public status: number = 200;
  public headers: [string, string][] = [];
  private setcookies: {[_: string]: {value: string, options: CookieOptions}|null} = {};
  private _send: boolean = false;
  public get send(): boolean {
    return this._send;
  }

  public setBody(body: string | JSONSuccess | null): ClientSuccess;
  public setBody(body: Uint8Array | Deno.Reader | string): ClientSuccess;
  public setBody(body: Uint8Array | Deno.Reader | string | JSONSuccess | null): ClientSuccess {
    if (this.mimeType === "") {
      if (body === null || typeof body === 'string') {
        this.mimeType = "text/plain";
      } else if (body instanceof Uint8Array || typeof body.read === 'function') {
        this.mimeType = "application/octet-stream";
      } else {
        this.mimeType = "application/json";
      }
    }

    if (body === null) {
      this.body = "null";
    } else if (body instanceof Uint8Array || typeof body === 'string' || typeof body.read === 'function') {
      this.body = body as Uint8Array | Deno.Reader | string;
    } else {
      this.body = JSON.stringify(body);
    }
    return this;
  }

  public setMimeType(mimeType: string): ClientSuccess {
    this.mimeType = mimeType;
    return this;
  }

  public setStatus(status: number): ClientSuccess {
    this.status = status;
    return this;
  }

  public addHeader(key: string, value: string): ClientSuccess {
    this.headers.push([key, value]);
    return this;
  }

  public deleteCookie(key: string): ClientSuccess {
    this.setcookies[key] = null;
    return this;
  }

  public setCookie(key: string, value: string, options: CookieOptions = {}): ClientSuccess {
    this.setcookies[key] = {value, options};
    return this;
  }

  /** @internal */
  public async _respond(req: Request) {
    if (this.send) 
      throw ReferenceError("Already send!");
    if (this.body !== null) {
      const cookieHeaders: [string, string][] = [];
      for (const key in this.setcookies) {
        if (this.setcookies.hasOwnProperty(key)) {
          let val = this.setcookies[key] || { value: "", options: { expires: 1000 } };
          console.log(val);
          cookieHeaders.push(generateCookieHeader(key, val.value, val.options));
        }
      }
      console.log(cookieHeaders);
      await req.req.respond({ body: this.body, headers: this.toHeaders([['content-type', this.mimeType], ...cookieHeaders, ...this.headers]), status: this.status });
      this._send = true;
    } else {
      throw ReferenceError("Cannot send response without body!");
    }
  }

  private toHeaders(headers: [string, string][]): Headers {
    const res = new Headers();
    for (const [key, val] of headers) {
      res.append(key, val);
    }
    return res;
  }
}

export interface ServerParameters {
  port: number;
}

export interface ServerOptions {
  port?: number;
}

export type RequestMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";