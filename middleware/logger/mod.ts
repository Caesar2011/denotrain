import { Router } from "../../mod.ts";
import { red, yellow, cyan, green } from "./deps.ts";

export interface LoggerContext {
  log(...msg: any[]): void;
  debug(...msg: any[]): void;
  warn(...msg: any[]): void;
  error(...msg: any[]): void;
}

export class TrainLogger extends Router<LoggerContext, any> {
  constructor() {
    super();
    this.use({ lifecycle: "postSending" }, (ctx) => {
      const status = ctx.res.status;
      const statusStr = (status + "").padStart(3, " ");
      const coloredStatus: string = (status < 200)
        ? statusStr
        : (status < 300)
        ? green(statusStr)
        : (status < 400)
        ? cyan(statusStr)
        : (status < 500)
        ? yellow(statusStr)
        : red(statusStr);
      const method = ctx.req.original.method;
      const url = ctx.req.original.url;

      this.app?.data.log(coloredStatus, method, url);
    });
  }

  onInit() {
    const loggerCtx = {
      log: (...msg: any[]) => console.log("[L]", ...msg),
      warn: (...msg: any[]) => console.warn("[W]", ...msg),
      debug: (...msg: any[]) => console.debug("[D]", ...msg),
      error: (...msg: any[]) => console.error("[E]", ...msg),
    };
    this.app?.data;
    Object.assign(this.app?.data, loggerCtx);
  }
}
