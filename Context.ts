import { ServerRequest } from "./deps.ts";
import { Application } from "./Application.ts";
import { Response } from "./Response.ts";
import { Request } from "./Request.ts";

export class Context<
  S extends object = { [key: string]: any },
  R extends object = { [key: string]: any },
> {
  public readonly res: Response = new Response(this);
  public readonly req: Request;
  public data: R = {} as R;

  constructor(request: ServerRequest, public readonly app: Application<S, R>) {
    this.req = new Request(request);
  }
}
