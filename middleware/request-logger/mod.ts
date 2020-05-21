import { Router } from "./deps.ts";

export class TrainLogger extends Router<any, any> {
  constructor() {
    super();
    this.use({ lifecycle: "postSending" }, (ctx) => {
      const status = ctx.res.status;
      const method = ctx.req.original.method;
      const url = ctx.req.original.url;

      const logger = this.app?.logger;

      if (status >= 500) {
        logger?.error(status, method, url);
      } else if (status === 404) {
        logger?.warn(status, method, url);
      } else {
        logger?.info(status, method, url);
      }
    });
  }
}
