import { readFileStr } from './deps.ts';
import { Context } from "./Context.ts";

export abstract class ViewEngine {
  constructor(public path: string) { }

  public async render(file: string, data: {[_: string]: any}, ctx: Context<any, any>): Promise<void> {
    const joinPath = new URL(this.path + "/" + file, window.location.href).pathname;
    const f = await readFileStr(joinPath);
    return this._render(f, data, ctx);
  }

  protected abstract async _render(template: string, data: {[_: string]: any}, ctx: Context<any, any>): Promise<void>;
}