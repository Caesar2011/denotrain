import { Context } from "./Context.ts";
import { parseValue, UrlEncodedValue } from './utils/urlencoded.ts';
import { Obj } from './utils/object.ts';

export class Router<S extends object = Obj, R extends object = Obj> {
  private handlers: HandlerEntry<S, R>[] = [];

  public add(path: Path|RequestHandler<S, R>, method: string|null, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    if (instanceOfRequestHandler<S, R>(path)) {
      this.handlers.push(this.generateHandlerEntry(null, null, path));
      path = null;
    }
    for (const handler of handlers) {
      this.handlers.push(this.generateHandlerEntry(path, null, handler));
    }
    return this;
  }

  public use(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public use(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public use(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, null, ...handlers);
  }

  public get(path: string|RegExp|null, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public get(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public get(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "GET", ...handlers);
  }

  public head(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public head(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public head(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "HEAD", ...handlers);
  }

  public post(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public post(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public post(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "POST", ...handlers);
  }

  public put(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public put(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public put(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "PUT", ...handlers);
  }

  public delete(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public delete(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public delete(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "DELETE", ...handlers);
  }

  public patch(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public patch(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public patch(path: Path|RequestHandler<S, R>, ...handlers: RequestHandler<S, R>[]): Router<S, R> {
    return this.add(path, "PATCH", ...handlers);
  }

  public async handle(ctx: Context<S, R>): Promise<RequestHandlerSuccess> {
    const req = ctx.req;
    let result: RequestHandlerSuccess = undefined;
    for (const handler of this.handlers) {
      const matchedPath = this.matchPath(ctx, handler);
      if (matchedPath) {
        // Update parameters
        const oldRelPath: string = req.relPath;
        const oldParams = req.param;
        req.relPath = matchedPath.newSubPath;
        req.param = {...req.param, ...matchedPath.addParams};
        // Handle
        if (handler.handler instanceof Router) {
          result = await handler.handler.handle(ctx);
        } else {
          result = await handler.handler(ctx);
        }
        // Restore
        req.relPath = oldRelPath;
        req.param = oldParams;
        if (result !== undefined) {
          return result;
        }
      }
    }
    return undefined;
  }

  private generateHandlerEntry(path: Path, method: RequestMethod|null, handler: RequestHandler<S, R>): HandlerEntry<S, R> {
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

  private matchPath(ctx: Context<S, R>, handler: HandlerEntry<S, R>): {newSubPath: string, addParams: {[_: string]: UrlEncodedValue}}|null {
    const req = ctx.req;
    if (!handler.regex) {
      return {newSubPath: req.relPath || "/", addParams: {}};
    }
    if (handler.method && handler.method !== req.original.method)
      return null;
    const match = req.relPath.match(handler.regex);
    if (match) {
      const newSubPath = req.relPath.substring(match[0].length) || "/";
      const addParams: {[_: string]: UrlEncodedValue} = {};
      for (let i = 0; i < handler.params.length; i++) {
        addParams[handler.params[i]] = parseValue(match[i+1]);
      }

      return {newSubPath, addParams};
    } else {
      return null;
    }
  }
}

export type RequestMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
export type Body = Uint8Array | Deno.Reader | string | JSONSuccess;

export type RequestHandler<S extends object = Obj, R extends object = Obj> = 
  Router<S, R> | ((req: Context<S, R>) => (Promise<RequestHandlerSuccess> | RequestHandlerSuccess));export type RequestHandlerSuccess = true|Body|void;
function instanceOfRequestHandler<S extends object = Obj, R extends object = Obj>(object: any): object is RequestHandler<S, R> {
  return object instanceof Router || typeof object === 'function';
}

type Path = string|RegExp|null;
type JSONSuccess = {[_: string]: any};
interface HandlerEntry<S extends object = Obj, R extends object = Obj> {
  regex: RegExp|null,
  params: string[],
  method: RequestMethod|null,
  handler: RequestHandler<S, R>
};