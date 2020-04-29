import { Router, Context } from "../../mod.ts";

export class TrainStatic extends Router {
  constructor(private root: string) {
    super();
    this.get(async (ctx: Context) => {
      const joinPath = new URL(this.root + (ctx.req.relPath || "/index.html"), window.location.href).pathname;
      const successful = await ctx.res.file(joinPath);
      if (successful)
        return true;
    });
  }
}