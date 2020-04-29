import { RequestHandler, ClientError, Context } from "../../mod.ts";
import { v4 } from "./deps.ts";

export interface TicketContext {
  login(username: string, password: string, auths?: string|string[]|null): Promise<boolean>;
  register(username: string, password: string, auth: string, data?: UserRegister): Promise<boolean>;
  logout(): Promise<void>;
  isLoggedIn(): boolean;
  user: User|null;
  ticket: string|null;
}

export class TrainTicket {

  private readonly options: TicketParameters;
  private readonly authenticators: {[_: string]: TicketAuthenticator} = {};

  constructor(private storage: TicketStorage, options?: TicketOptions) {
    this.options = {...{sessionKey: "train.session.id", ticketLifespan: 60*60*24}, ...options};
    this.storage.setTicketLifespan(this.options.ticketLifespan);
  }

  addAuthenticator(key: string, auth: TicketAuthenticator) {
    this.authenticators[key] = auth;
  }

  readonly sessionMiddleware: RequestHandler<any, TicketContext> = async (ctx) => {
    const ticketContext: TicketContext = {
      isLoggedIn: () => {
        return ctx.data.user !== null;
      },

      login: async (username: string, password: string, auths: string|string[]|null = null) => {
        if (auths === null) {
          auths = Object.keys(this.authenticators);
        }
        if (typeof auths === "string") {
          auths = [auths];
        }
        for (const auth of auths) {
          const user = await this.authenticators[auth].login(username, password);
          if (user !== null) {
            ctx.data.ticket = ctx.data.ticket || v4.generate();
            ctx.data.user = {provider: auth, ...user};
            this.storage.upsertTicket(ctx.data.ticket, ctx.data.user);
            return true;
          }
        }
        return false;
      },

      register: async (username: string, password: string, auth: string, data?: UserRegister) => {
        const user = await this.authenticators[auth].register(username, password, data);
        if (user !== null) {
          return true;
        }
        return false;
      },

      logout: async () => {
        ctx.data.user = null;
        if (ctx.data.ticket) {
          this.storage.invalidateTicket(ctx.data.ticket);
        }
      },

      user: null,
      ticket: null
    };

    const cookieTicket = ctx.req.cookies[this.options.sessionKey];
    if (cookieTicket) {
      ticketContext.user = await this.storage.loadTicket(cookieTicket);
      ticketContext.ticket = cookieTicket;
    }

    Object.assign(ctx.data, ticketContext);
  }

  readonly isLoggedInMiddleware: RequestHandler<any, TicketContext> = (ctx) => {
    if (!ctx.data.user) {
      throw new TicketError(401, "User not authenticated!");
    }
  }

  readonly doLoginMiddleware: RequestHandler<any, TicketContext> = (ctx) => {
    if (ctx.req.body.username && ctx.req.body.password)
      return ctx.data.login(ctx.req.body.username, ctx.req.body.password);
    else
      throw new TicketError(422, "Username or password not provided!");
  }

  readonly doLogoutMiddleware: RequestHandler<any, TicketContext> = (ctx) => {
    return ctx.data.logout();
  }
}

export class TicketError extends ClientError { }

export interface TicketAuthenticator {
  login(username: string, password: string): Promise<UserProvided|null>;
  register(username: string, password: string, data?: UserRegister): Promise<UserProvided|null>;
}

export interface TicketStorage {
  setTicketLifespan(sec: number): void;
  loadTicket(ticket: string): Promise<User|null>;
  upsertTicket(ticket: string, user: User): Promise<void>;
  invalidateTicket(ticket: string): Promise<void>;
}

export interface TicketParameters extends TicketOptions {
  sessionKey: string;
  ticketLifespan: number;
}

export interface TicketOptions {
  sessionKey?: string;
  ticketLifespan?: number;
}

export type User = UserProvided & {
  provider: string;
};

export type UserProvided = UserRegister & {
  id: string;
  displayName: string;
};

export type UserRegister = {
  displayName?: string;
  name?: {
    familiyName?: string;
    givenName?: string;
    middleName?: string;
  };
  emails?: {value: string; type: string}[];
  photos?: {value: string;}[];
  other?: {[_: string]: any};
};