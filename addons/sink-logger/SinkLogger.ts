import { LogLevel, Logger, LogLevelHirachy, replaceAll } from "./deps.ts";

export interface Sink {
  emit(logLevel: LogLevel, prefix: string, msg: any[]): void;
}

export class SinkLogger implements Logger {
  private readonly replacements: string[];

  constructor(
    private sinks: Sink[],
    private logLevel: LogLevel = "LOG",
    private prefix: string = "[{lvl} / {timeUTC}]",
    private prefixParser?: (level: LogLevel) => string,
  ) {
    this.replacements = this.getReplacements(prefix);
  }

  public log(...msg: any[]): void {
    this.eval("LOG", msg);
  }

  public debug(...msg: any[]): void {
    this.eval("DEBUG", msg);
  }

  public info(...msg: any[]): void {
    this.eval("INFO", msg);
  }

  public warn(...msg: any[]): void {
    this.eval("WARN", msg);
  }

  public error(...msg: any[]): void {
    this.eval("ERROR", msg);
  }

  public critical(...msg: any[]): void {
    msg = this.formatMsg(msg);
    this.eval("CRITICAL", msg);
  }

  public setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  public getReplacements(msg: string): string[] {
    const found = new Set<string>();
    const regex = /{([^}]+)}/g;
    let curMatch: RegExpExecArray | null;

    while (curMatch = regex.exec(msg)) {
      found.add(curMatch[1]);
    }
    return Array.from(found);
  }

  private eval(level: LogLevel, msg: any[]) {
    if (LogLevelHirachy[this.logLevel] <= LogLevelHirachy[level]) {
      msg = this.formatMsg(msg);
      const prefix = this.parsePrefix(level);
      for (const sink of this.sinks) {
        sink.emit(level, prefix, msg);
      }
    }
  }

  private parsePrefix(level: LogLevel): string {
    if (this.prefixParser) {
      return this.prefixParser(level);
    }
    if (this.replacements.length == 0) {
      return this.prefix;
    }
    const date = new Date();
    const repl: { [_: string]: string } = {
      level,
      lvl: level[0],
      timeUTC: date.toUTCString(),
      timeLocale: date.toLocaleString(),
      timeISO: date.toISOString(),
    };
    return this.formatMsg([this.prefix, repl])[0];
  }

  private formatMsg(msg: any[]): any[] {
    if (
      msg.length === 2 && typeof msg[0] === "string" &&
      typeof msg[1] === "object"
    ) {
      let result = msg[0];
      const data = msg[1];
      const repls = this.getReplacements(result);
      if (repls.length > 0) {
        for (const repl of repls) {
          result = replaceAll(result, `{${repl}}`, data[repl]);
        }
        return [result];
      }
    }
    return msg;
  }
}
