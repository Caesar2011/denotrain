import { Router } from "../../mod.ts";
import {red, yellow, cyan, green} from "./deps.ts";

export class TrainLogger extends Router {
  constructor() {
    super();
    this.use((ctx) => {
      ctx.res.addRespondListener(async () => {
        const status = ctx.res.status;
        const method = ctx.req.original.method;
        const url = ctx.req.original.url;
        if (status >= 200) {
          console.log(green(status + ""), method, url);
        } else if (status >= 300) {
          console.log(cyan(status + ""), method, url);
        } else if (status >= 400) {
          console.log(yellow(status + ""), method, url);
        } else if (status >= 500) {
          console.log(red(status + ""), method, url);
        } else {
          console.log("   ", method, url);
        }
      });
    });
  }
}