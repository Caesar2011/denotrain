import { serve, ServerRequest, join, readFileStr } from './deps.ts'
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
  public options: ServerParameters;

  constructor(options: ServerOptions) {
    super();
    const defs = {port: 3000};
    this.options = {...defs, ...options};
  }

  public async run() {
    const s = serve({ port: this.options.port });
    console.log(`Serving on http://localhost:${this.options.port}/`);
    for await (const req of s) {
      this.handleRequest(req);
    }
  }

  private async handleRequest(request: ServerRequest): Promise<void> {
    try {
      const req = new Request(request, this);
      const result = await this.handle(req);
      if (result !== undefined) {
        if (result !== true) {
          req.setBody(result);
        }
        await req._respond();
        return;
      }
    } catch (e) {
      console.error(e);
      if (e instanceof ClientError) {
        await new Request(request, this)
          .setBody(e.message)
          .setStatus(e.statusCode)
          ._respond();
        return;
      } else {
        await new Request(request, this)
          .setBody("Internal server error!")
          .setStatus(500)
          ._respond();
      }
    }
    await new Request(request, this)
      .setBody(`Requested route ${request.url} not found!`)
      .setStatus(404)
      ._respond();
  }
}

export class Request {
  readonly query: {[_: string]: UrlEncodedValue|UrlEncodedValue[]} = {};
  readonly param: {[_: string]: UrlEncodedValue|UrlEncodedValue[]} = {};
  readonly body: {[_: string]: any} = {};
  readonly cookies: {[_: string]: string} = {};
  readonly path: string = "";
  relPath: string = "";
  readonly data: {[_: string]: any} = {};


  private resBody: Body | null = null;
  private resMimeType: string = "";
  private resStatus: number = 200;
  private resHeaders: [string, string][] = [];
  private resSetcookies: {[_: string]: {value: string, options: CookieOptions}|null} = {};
  private _send: boolean = false;

  constructor(public readonly req: ServerRequest, public readonly app: Server) {
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

  async render(file: string, data: {[_: string]: any} = {}): Promise<void> {
    if (!this.app.options.viewEngine)
      throw ReferenceError("No view engine provided!");
    return this.app.options.viewEngine.render(file, data, this);
  }

  public setBody(body: string | JSONSuccess | null): Request;
  public setBody(body: Body): Request;
  public setBody(body: Body | JSONSuccess | null): Request {
    if (this.resMimeType === "") {
      if (body === null || typeof body === 'string') {
        this.resMimeType = "text/plain";
      } else if (body instanceof Uint8Array || typeof body.read === 'function') {
        this.resMimeType = "application/octet-stream";
      } else {
        this.resMimeType = "application/json";
      }
    }

    if (body === null) {
      this.resBody = "null";
    } else if (body instanceof Uint8Array || typeof body === 'string' || typeof body.read === 'function') {
      this.resBody = body as Body;
    } else {
      this.resBody = JSON.stringify(body);
    }
    return this;
  }

  public setMimeType(mimeType: string): Request {
    this.resMimeType = mimeType;
    return this;
  }

  public setStatus(status: number): Request {
    this.resStatus = status;
    return this;
  }

  public addHeader(key: string, value: string): Request {
    this.resHeaders.push([key, value]);
    return this;
  }

  public deleteCookie(key: string): Request {
    this.resSetcookies[key] = null;
    return this;
  }

  public setCookie(key: string, value: string, options: CookieOptions = {}): Request {
    this.resSetcookies[key] = {value, options};
    return this;
  }

  /** @internal */
  public async _respond(): Promise<void> {
    if (this._send) 
      throw ReferenceError("Already send!");
    if (this.resBody !== null) {
      const cookieHeaders: [string, string][] = [];
      for (const key in this.resSetcookies) {
        if (this.resSetcookies.hasOwnProperty(key)) {
          let val = this.resSetcookies[key] || { value: "", options: { expires: 1000 } };
          cookieHeaders.push(generateCookieHeader(key, val.value, val.options));
        }
      }
      await this.req.respond({ body: this.resBody, headers: new Headers([['content-type', this.resMimeType], ...cookieHeaders, ...this.resHeaders]), status: this.resStatus });
      this._send = true;
    } else {
      throw ReferenceError("Cannot send response without body!");
    }
  }
}

export class ClientError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}

export abstract class ViewEngine {
  constructor(public path: string) { }

  public async render(file: string, data: {[_: string]: any}, req: Request): Promise<void> {
    console.log(window.location.href, this.path, this.path + "/" + file);
    const joinPath = new URL(this.path + "/" + file, window.location.href).pathname;
    const f = await readFileStr(joinPath);
    return this._render(f, data, req);
  }

  protected abstract async _render(template: string, data: {[_: string]: any}, req: Request): Promise<void>;
}



export interface ServerParameters extends ServerOptions {
  port: number;
}

export interface ServerOptions {
  port?: number;
  viewEngine?: ViewEngine;
}

export type RequestMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

type Body = Uint8Array | Deno.Reader | string;
type JSONSuccess = {[_: string]: any};
export type RequestHandler = Router | ((req: Request) => (Promise<RequestHandlerSuccess> | RequestHandlerSuccess));
export type RequestHandlerSuccess = true|string|JSONSuccess|null|void;
function instanceOfRequestHandler(object: any): object is RequestHandler {
  return object instanceof Router || typeof object === 'function';
}

type HandlerEntry = {regex: RegExp|null, params: string[], method: RequestMethod|null, handler: RequestHandler};
