import {
  TicketAuthenticator,
  UserProvided,
  UserRegister,
} from "../auth/mod.ts";
import { SHA256 } from "./deps.ts";

export class MemoryAuthenticator implements TicketAuthenticator {
  private users: { [hash: string]: UserProvided } = {};
  private nextId = 1;

  constructor(
    users: { username: string; password: string; data?: UserRegister }[] = [],
  ) {
    for (const user of users) {
      this.register(user.username, user.password, user.data);
    }
  }

  async register(
    username: string,
    password: string,
    data?: UserRegister | undefined,
  ): Promise<UserProvided | null> {
    const sha = new SHA256();
    sha.init();
    sha.update(username);
    sha.update(password);
    const key = sha.digest("base64") as string;
    this.users[key] = {
      ...{ displayName: username },
      ...data,
      ...{ id: (this.nextId++) + "" },
    };
    return this.users[key];
  }

  async login(
    username: string,
    password: string,
  ): Promise<UserProvided | null> {
    const sha = new SHA256();
    sha.init();
    sha.update(username);
    sha.update(password);
    const key = sha.digest("base64") as string;
    return this.users[key] || null;
  }
}
