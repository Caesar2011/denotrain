import { Router, ClientError } from "./deps.ts";

export class JsonError extends Router<any, any> {
  constructor(detailedServerError: boolean = false) {
    super();
    this.use({ lifecycle: "postHandling" }, (ctx) => {
      if (!ctx.error) {
        return;
      }
      ctx.res.setMimeType("application/json");
      if (ctx.error instanceof ClientError) {
        ctx.res.setBody({
          status: ctx.error.statusCode,
          msg: ctx.error.message,
          details: ctx.error.details,
        });
      } else if (detailedServerError && ctx.error instanceof Error) {
        ctx.res.setBody({
          status: ctx.res.status,
          msg: ctx.res.body,
          details: {
            name: ctx.error.name,
            msg: ctx.error.message,
          },
        });
      } else {
        ctx.res.setBody({
          status: ctx.res.status,
          msg: ctx.res.body,
          details: {},
        });
      }
    });
  }
}
