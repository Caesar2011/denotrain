import { ViewEngine, Context, render } from "./deps.ts";

export class DejsEngine extends ViewEngine {
  protected async _render(
    template: string,
    data: { [_: string]: any },
    ctx: Context,
  ): Promise<void> {
    ctx.res
      .setBody(await render(template, data))
      .setMimeType("text/html");
  }
}
