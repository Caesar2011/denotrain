import { Router, Request } from "../mod.ts";
import {red, yellow, cyan, green} from "../deps.ts";

export class TrainLogger extends Router {
  constructor() {
    super();
    this.use((req: Request) => {
      req.addRespondListener(async () => {
        if (req.resStatus >= 200) {
          console.log(green(req.resStatus + ""), req.req.method, req.req.url);
        } else if (req.resStatus >= 300) {
          console.log(cyan(req.resStatus + ""), req.req.method, req.req.url);
        } else if (req.resStatus >= 400) {
          console.log(yellow(req.resStatus + ""), req.req.method, req.req.url);
        } else if (req.resStatus >= 500) {
          console.log(red(req.resStatus + ""), req.req.method, req.req.url);
        } else {
          console.log("   ", req.req.method, req.req.url);
        }
      });
    });
  }
}