import { serve, ServerRequest } from "./deps.ts";
import { Router } from "./Router.ts";
import { Context } from "./Context.ts";
import { ViewEngine } from "./ViewEngine.ts";
import { ClientError } from "./ClientError.ts";

export class Application<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> extends Router<S, R> {
  public options: AppParameters;
  public data: S = {} as S;

  constructor(options: AppOptions) {
    super();
    const defs = { port: 3000 };
    this.options = { ...defs, ...options };
  }

  public async run() {
    const s = serve({ port: this.options.port });
    console.log(`Serving on http://localhost:${this.options.port}/`);
    for await (const req of s) {
      this.handleRequest(req);
    }
  }

  private async handleRequest(request: ServerRequest): Promise<void> {
    const ctx = new Context<S, R>(request, this);
    await ctx.req.init();
    try {
      const result = await this.handle(ctx);
      if (result !== undefined) {
        if (result !== true) {
          ctx.res.setBody(result);
        }
      } else {
        ctx.res
          .setBody(`Requested route ${request.url} not found!`)
          .setStatus(404);
      }
    } catch (e) {
      console.error(e);
      if (e instanceof ClientError) {
        ctx.res
          .setBody(e.message)
          .setStatus(e.statusCode);
      } else {
        ctx.res
          .setBody("Internal server error!")
          .setStatus(500);
      }
    }
    await ctx.res
      ._respond();
  }
}

interface AppParameters extends AppOptions {
  port: number;
}

export interface AppOptions {
  port?: number;
  viewEngine?: ViewEngine;
}
