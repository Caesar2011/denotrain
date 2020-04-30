import { Router, Context } from "../../mod.ts";

export class TrainStatic extends Router {
  constructor(private root: string) {
    super();
    this.get(async (ctx: Context) => {
      let joinPath = new URL(
        this.root + (ctx.req.relPath || "/index.html"),
        window.location.href,
      ).pathname;
      joinPath = Deno?.build.os == "windows" ? joinPath.substring(1) : joinPath;
      const successful = await ctx.res.file(joinPath);
      if (successful) {
        return true;
      }
    });
  }
}
