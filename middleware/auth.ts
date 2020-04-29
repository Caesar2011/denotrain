import { RequestHandler, Request, ClientError } from "../mod.ts";
import { v4 } from "../deps.ts";

declare module "../mod.ts" {
  interface Request {
    ticket: {
      login(username: string, password: string, auths?: string|string[]|null): Promise<boolean>;
      register(username: string, password: string, auth: string, data?: UserRegister): Promise<boolean>;
      logout(): Promise<void>;
      isLoggedIn(): boolean;
      user: User|null;
      ticket: string|null;
    }
  }
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

  readonly sessionMiddleware: RequestHandler = async (req: Request) => {
    req.ticket.isLoggedIn = () => {
      return req.ticket.user !== null;
    };
    req.ticket.login = async (username: string, password: string, auths: string|string[]|null = null) => {
      if (auths === null) {
        auths = Object.keys(this.authenticators);
      }
      if (typeof auths === "string") {
        auths = [auths];
      }
      for (const auth of auths) {
        const user = await this.authenticators[auth].login(username, password);
        if (user !== null) {
          req.ticket.ticket = req.ticket.ticket || v4.generate();
          req.ticket.user = {provider: auth, ...user};
          this.storage.upsertTicket(req.ticket.ticket, req.ticket.user);
          return true;
        }
      }
      return false;
    };
    req.ticket.register = async (username: string, password: string, auth: string, data?: UserRegister) => {
      const user = await this.authenticators[auth].register(username, password, data);
      if (user !== null) {
        return true;
      }
      return false;
    };
    req.ticket.logout = async () => {
      req.ticket.user = null;
      if (req.ticket.ticket) {
        this.storage.invalidateTicket(req.ticket.ticket);
      }
    };

    const cookieTicket = req.cookies[this.options.sessionKey];
    if (cookieTicket) {
      req.ticket.user = await this.storage.loadTicket(cookieTicket);
      req.ticket.ticket = cookieTicket;
    } else {
      req.ticket.user = null;
      req.ticket.ticket = null;
    }
  }

  readonly isLoggedInMiddleware: RequestHandler = (req: Request) => {
    if (!req.data.user) {
      throw new TicketError(401, "User not authenticated!");
    }
  }

  readonly doLoginMiddleware: RequestHandler = (req: Request) => {
    if (req.body.username && req.body.password)
      return req.ticket.login(req.body.username, req.body.password);
    else
      throw new TicketError(422, "Username or password not provided!");
  }

  readonly doLogoutMiddleware: RequestHandler = (req: Request) => {
    return req.ticket.logout();
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