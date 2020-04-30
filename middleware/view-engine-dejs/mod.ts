import { render } from "https://deno.land/x/dejs@0.3.5/mod.ts";
import { ViewEngine, Context } from "../../mod.ts";

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
