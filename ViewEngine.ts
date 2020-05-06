import { readFileStr, join } from "./deps.ts";
import { Context } from "./Context.ts";

export abstract class ViewEngine {
  constructor(public path: string) {}

  public async render(
    file: string,
    data: { [_: string]: any },
    ctx: Context<any, any>,
  ): Promise<void> {
    const joinPath = ctx.app.options.appRoot
      ? join(ctx.app.options.appRoot, this.path, file)
      : join(this.path, file);
    const f = await readFileStr(joinPath);
    return this._render(f, data, ctx);
  }

  protected abstract _render(
    template: string,
    data: { [_: string]: any },
    ctx: Context<any, any>,
  ): Promise<void>;
}
