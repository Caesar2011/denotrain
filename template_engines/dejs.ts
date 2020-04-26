import { render } from 'https://deno.land/x/dejs@0.3.5/mod.ts';
import { ViewEngine, Request } from "../mod.ts";

export class DejsEngine extends ViewEngine {
  protected async _render(template: string, data: { [_: string]: any; }, req: Request): Promise<void> {
    req.response
      .setBody(await render(template, data))
      .setMimeType("text/html");
  }
}