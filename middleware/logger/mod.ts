import { Router } from "../../mod.ts";
import { red, yellow, cyan, green } from "./deps.ts";

export class TrainLogger extends Router {
  constructor() {
    super();
    this.use({ lifecycle: "postSending" }, (ctx) => {
      const status = ctx.res.status;
      const statusStr = (status + "").padStart(3, " ");
      const coloredStatus: string =
        (status < 200) ? statusStr :
        (status < 300) ? green(statusStr) :
        (status < 400) ? cyan(statusStr) :
        (status < 500) ? yellow(statusStr) :
        red(statusStr)
      const method = ctx.req.original.method;
      const url = ctx.req.original.url;

      console.log(coloredStatus, method, url);
    });
  }
}
