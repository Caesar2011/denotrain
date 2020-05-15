import { Context } from "./Context.ts";
import { parseValue, UrlEncodedValue } from "./utils/urlencoded.ts";
import { Obj } from "./utils/object.ts";
import { Application } from "./Application.ts";

export class Router<S extends object = Obj, R extends object = Obj> {
  protected app?: Application<S, R>;
  private updateRouterHandler: Router[] = [];

  private handlers: HandlerObject<S, R> = {
    onRequest: [],
    preParsing: [],
    preHandling: [],
    onHandle: [],
    postHandling: [],
    preSending: [],
    postSending: [],
  };

  public add(
    obj: RequestOptions | Path | RequestHandler<S, R>,
    method: RequestMethod | null,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    let nLifecicle: LifecycleHook | undefined = undefined;
    let nPath: Path = null;
    if (instanceOfRequestHandler<S, R>(obj)) {
      handlers.unshift(obj);
    } else if (instanceOfRequestOptions(obj)) {
      if (obj.lifecycle !== undefined) {
        nLifecicle = obj.lifecycle;
      }
      if (obj.path !== undefined) {
        nPath = obj.path;
      }
    } else {
      nPath = obj;
    }
    let cycle: LifecycleHook | undefined;
    for (const handler of handlers) {
      if (nLifecicle !== undefined) {
        cycle = nLifecicle;
      } else if (handler instanceof Router) {
        cycle = undefined;
        if (this.app) {
          handler.onInit(this.app);
        } else {
          this.updateRouterHandler.push(handler);
        }
      } else {
        cycle = "onHandle";
      }
      if (cycle !== undefined) {
        this.handlers[cycle].push(
          this.generateHandlerEntry(nPath, method, handler),
        );
      } else {
        for (const key in this.handlers) {
          if (this.handlers.hasOwnProperty(key)) {
            this.handlers[key as LifecycleHook].push(
              this.generateHandlerEntry(nPath, method, handler),
            );
          }
        }
      }
    }
    return this;
  }

  public use(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public use(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public use(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public use(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, null, ...handlers);
  }

  public get(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public get(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public get(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public get(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "GET", ...handlers);
  }

  public head(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public head(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public head(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public head(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public head(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "HEAD", ...handlers);
  }

  public post(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public post(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public post(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public post(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "POST", ...handlers);
  }

  public put(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public put(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public put(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public put(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "PUT", ...handlers);
  }

  public delete(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public delete(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public delete(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public delete(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "DELETE", ...handlers);
  }

  public patch(
    path: RequestOptions,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R>;
  public patch(path: Path, ...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public patch(...handlers: RequestHandler<S, R>[]): Router<S, R>;
  public patch(
    path: RequestOptions | Path | RequestHandler<S, R>,
    ...handlers: RequestHandler<S, R>[]
  ): Router<S, R> {
    return this.add(path, "PATCH", ...handlers);
  }

  public async handle(
    ctx: Context<S, R>,
    lifecycle: LifecycleHook,
  ): Promise<RequestHandlerSuccess> {
    const req = ctx.req;
    let result: RequestHandlerSuccess = undefined;

    for (const iter of this.handlerIterator(ctx, lifecycle)) {
      // Update parameters
      const oldRelPath: string = req.relPath;
      const oldParams = req.params;
      req.relPath = iter.newSubPath;
      req.params = { ...req.params, ...iter.addParams };
      // Handle
      if (iter.handler instanceof Router) {
        result = await iter.handler.handle(ctx, lifecycle);
      } else {
        result = await iter.handler(ctx);
      }
      // Restore
      req.relPath = oldRelPath;
      req.params = oldParams;
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  protected onInit(app: Application<S, R>): void {
    this.app = app;
    this.updateRouterHandler.forEach((router) => router.onInit(app));
  }

  private generateHandlerEntry(
    path: Path,
    method: RequestMethod | null,
    handler: RequestHandler<S, R>,
  ): HandlerEntry<S, R> {
    if (typeof path == "string") {
      const paramMatches = path.matchAll(/\/:([a-z]+)/gi);
      const params: string[] = [];
      for (const match of paramMatches) {
        params.push(match[1]);
      }
      path = path
        .replace(/(.)\/$/, "$1")
        .replace(/\/:([a-z]+)/gi, "/([0-9a-zA-Z]+)");
      const regex = (handler instanceof Router)
        ? new RegExp(`^${path}`)
        : new RegExp(`^${path}$`);
      return { regex, params, method, handler };
    } else {
      return { regex: path, params: [], method, handler };
    }
  }

  private matchPath(
    ctx: Context<S, R>,
    handler: HandlerEntry<S, R>,
  ):
    | { newSubPath: string; addParams: { [_: string]: UrlEncodedValue } }
    | null {
    const req = ctx.req;
    if (!handler.regex) {
      return { newSubPath: req.relPath || "/", addParams: {} };
    }
    if (handler.method && handler.method !== req.original.method) {
      return null;
    }
    const match = req.relPath.match(handler.regex);
    if (match) {
      const newSubPath = req.relPath.substring(match[0].length) || "/";
      const addParams: { [_: string]: UrlEncodedValue } = {};
      for (let i = 0; i < handler.params.length; i++) {
        if (handler.params[i] === null) continue;
        addParams[handler.params[i]] = parseValue(match[i + 1]);
      }

      return { newSubPath, addParams };
    } else {
      return null;
    }
  }

  private *handlerIterator(ctx: Context<S, R>, lifecycle: LifecycleHook) {
    for (const handler of this.handlers[lifecycle]) {
      const matchedPath = this.matchPath(ctx, handler);
      if (matchedPath) {
        yield {
          newSubPath: matchedPath.newSubPath,
          addParams: matchedPath.addParams,
          handler: handler.handler,
        };
      }
    }
  }
}

export type RequestMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH"
  | string;

interface HandlerObject<S extends object = Obj, R extends object = Obj> {
  onRequest: HandlerEntry<S, R>[];
  preParsing: HandlerEntry<S, R>[];
  preHandling: HandlerEntry<S, R>[];
  onHandle: HandlerEntry<S, R>[];
  postHandling: HandlerEntry<S, R>[];
  preSending: HandlerEntry<S, R>[];
  postSending: HandlerEntry<S, R>[];
}

export type LifecycleHook = keyof HandlerObject<any, any>;

export type Body = Uint8Array | Deno.Reader | string | JSONSuccess;

export type RequestHandler<S extends object = Obj, R extends object = Obj> =
  | Router<S, R>
  | ((
    req: Context<S, R>,
  ) => (Promise<RequestHandlerSuccess> | RequestHandlerSuccess));

export type RequestHandlerSuccess = true | Body | void;

function instanceOfRequestHandler<
  S extends object = Obj,
  R extends object = Obj,
>(object: any): object is RequestHandler<S, R> {
  return object instanceof Router || typeof object === "function";
}

function instanceOfRequestOptions(object: any): object is RequestOptions {
  return typeof object === "object" &&
    (object.hasOwnProperty("path") || object.hasOwnProperty("lifecycle"));
}

type Path = string | RegExp | null;

type RequestOptions = {
  path?: string;
  params?: (string|null)[];
  lifecycle?: LifecycleHook;
};

type JSONSuccess = { [_: string]: any };

interface HandlerEntry<S extends object = Obj, R extends object = Obj> {
  regex: RegExp | null;
  params: string[];
  method: RequestMethod | null;
  handler: RequestHandler<S, R>;
}
