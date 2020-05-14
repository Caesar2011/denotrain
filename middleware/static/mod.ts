import { Router, Context, join } from "./deps.ts";

export class TrainStatic extends Router {
  constructor(private root: string) {
    super();
    this.get(async (ctx: Context) => {
      let relPath: string = ctx.req.relPath;
      if (relPath.endsWith("/")) {
        relPath = relPath + "index.html";
      }
      const joinPath = ctx.app.options.appRoot
        ? join(ctx.app.options.appRoot, this.root, relPath)
        : join(this.root, relPath);
      const successful = await ctx.res.file(joinPath);
      if (successful) {
        return true;
      }
    });
  }
}
