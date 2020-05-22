import { serve, serveTLS, ServerRequest } from "../deps.ts";
import { Router, LifecycleHook } from "./Router.ts";
import { Context } from "./Context.ts";
import { ViewEngine } from "./ViewEngine.ts";
import { CookieStorage } from "./CookieStorage.ts";
import { ClientError } from "./ClientError.ts";
import { CookieOptions } from "./utils/cookies.ts";
import { Logger, LogLevel } from "./Logger.ts";
import { SinkLogger } from "../addons/sink-logger/SinkLogger.ts";
import { ConsoleSink } from "../addons/sink-logger/ConsoleSink.ts";
import { MemoryCookieStorage } from "../addons/memory-cookie-storage/MemoryCookieStorage.ts";

export class Application<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> extends Router<S, R> {
  public options: AppParameters;
  public servers: ListenOptions[];
  public data: S = {} as S;
  public logger: Logger;

  constructor(options?: AppOptions) {
    super();
    this.onInit(this);
    const defs = {
      logger: new SinkLogger([new ConsoleSink()], "LOG"),
      logLevel: "LOG" as LogLevel,

      cookieKey: "train.ticket",
      cookieStorage: new MemoryCookieStorage(),
      cookieOptions: { maxAge: 60 * 60 * 24 },
      cookieSecret: "changeThis",
    };
    this.options = { ...defs, ...options };
    this.options.logger.setLogLevel(this.options.logLevel);
    this.logger = this.options.logger;

    this.servers = [{
      port: this.options.port,
      hostname: this.options.hostname,
      certFile: this.options.certFile,
      keyFile: this.options.keyFile,
    }, ...(options?.additionalServers ?? [])];
  }

  public async run() {
    await Promise.race(this.servers.map((server) => this.runServer(server)));
  }

  private async runServer(server: ListenOptions) {
    const options = {
      port: 3000,
      hostname: "0.0.0.0",
      ...server,
    };
    const [s, protocol] = (options.certFile && options.keyFile)
      ? [serveTLS(options as Deno.ListenTlsOptions), "https"]
      : [serve(options), "http"];
    this.logger.info(
      `Serving on ${protocol}://${options.hostname}:${options.port}/`,
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

  public async handleRequest(request: ServerRequest): Promise<Context> {
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
        this.logger.error(e);
        ctx.res
          .setBody("Internal server error!")
          .setStatus(500);
      }
    }
    try {
      // Parse ctx.error (error response); filter REST json data
      await this.runHook(ctx, "postHandling");
    } catch (e) {
      this.logger.error(e);
    }
    // Parse the response object and create ctx.res.response
    await ctx._prepareResponse();
    try {
      // Manipulate final ctx.res.response to be send
      await this.runHook(ctx, "preSending");
    } catch (e) {
      this.logger.error(e);
    }
    // Send response to the client
    await ctx._respond();
    try {
      // clean up data; generate statistics
      await this.runHook(ctx, "postSending");
    } catch (e) {
      this.logger.error(e);
    }
    return ctx;
  }
}

interface AppParameters extends AppOptions {
  logger: Logger;
  logLevel: LogLevel;

  cookieStorage: CookieStorage;
  cookieKey: string;
  cookieOptions: CookieOptions;
  cookieSecret: string;
}

export interface AppOptions {
  port?: number;
  hostname?: string;
  certFile?: string;
  keyFile?: string;

  additionalServers?: ListenOptions[];

  appRoot?: string;

  logger?: Logger;
  logLevel?: LogLevel;

  viewEngine?: ViewEngine;

  cookieStorage?: CookieStorage;
  cookieKey?: string;
  cookieOptions?: CookieOptions;
  cookieSecret?: string;
}

export interface ListenOptions {
  port?: number;
  hostname?: string;
  certFile?: string;
  keyFile?: string;
}
