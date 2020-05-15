import { serve, ServerRequest } from "./deps.ts";
import { Router, LifecycleHook } from "./Router.ts";
import { Context } from "./Context.ts";
import { ViewEngine } from "./ViewEngine.ts";
import { CookieStorage, MemoryCookieStorage } from "./CookieStorage.ts";
import { ClientError } from "./ClientError.ts";
import { CookieOptions } from "./utils/cookies.ts";

export class Application<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> extends Router<S, R> {
  public options: AppParameters;
  public data: S = {} as S;

  constructor(options: AppOptions) {
    super();
    this.onInit(this);
    const defs = {
      port: 3000,
      hostname: "0.0.0.0",
      cookieKey: "train.ticket",
      cookieStorage: new MemoryCookieStorage(),
      cookieOptions: { maxAge: 60 * 60 * 24 },
    };
    this.options = { ...defs, ...options };
  }

  public async run() {
    const s = serve(
      { port: this.options.port, hostname: this.options.hostname },
    );
    console.log(
      `Serving on http://${this.options.hostname}:${this.options.port}/`,
    );
    for await (const req of s) {
      this.handleRequest(req);
    }
  }

  private async runHook(ctx: Context<S, R>, lifecycle: LifecycleHook) {
    const result = await this.handle(ctx, lifecycle);
    if (
      result === undefined && lifecycle == "onHandle" && ctx.res.body === null
    ) {
      throw new ClientError(
        404,
        `Requested route ${ctx.req.original.method} ${ctx.req.original.url} not found!`,
      );
    } else if (result !== true && result !== undefined) {
      ctx.res.setBody(result);
    }
  }

  private async handleRequest(request: ServerRequest): Promise<void> {
    const ctx = new Context<S, R>(request, this);
    try {
      // Register functions to ctx.data
      // Start statistics
      await this.runHook(ctx, "onRequest");
      // Manipulate initial incoming request ctx.req.original
      await this.runHook(ctx, "preParsing");
      // Parsing cookies, query, body
      await ctx._init();
      // Manipulate parsed data, use cookies, load user data
      // add data to ctx.data
      await this.runHook(ctx, "preHandling");
      // Default handler; return data (json, html)
      await this.runHook(ctx, "onHandle");
    } catch (e) {
      ctx.error = e;
      if (e instanceof ClientError) {
        ctx.res
          .setBody(e.message)
          .setStatus(e.statusCode);
      } else {
        console.error(e);
        ctx.res
          .setBody("Internal server error!")
          .setStatus(500);
      }
    }
    try {
      // Parse ctx.error (error response); filter REST json data
      await this.runHook(ctx, "postHandling");
    } catch (e) {
      console.error(e);
    }
    // Parse the response object and create ctx.res.response
    await ctx.res._prepareResponse();
    try {
      // Manipulate final ctx.res.response to be send
      await this.runHook(ctx, "preSending");
    } catch (e) {
      console.error(e);
    }
    // Send response to the client
    await ctx._respond();
    try {
      // clean up data; generate statistics
      await this.runHook(ctx, "postSending");
    } catch (e) {
      console.error(e);
    }
  }
}

interface AppParameters extends AppOptions {
  port: number;
  hostname: string;
  cookieStorage: CookieStorage;
  cookieKey: string;
  cookieOptions: CookieOptions;
}

export interface AppOptions {
  appRoot?: string;
  port?: number;
  hostname?: string;
  viewEngine?: ViewEngine;
  cookieStorage?: CookieStorage;
  cookieKey?: string;
  cookieOptions?: CookieOptions;
}
