export interface Logger {
  log(msg: string, data: { [_: string]: any }): void;
  log(...msg: any[]): void;
  debug(msg: string, data: { [_: string]: any }): void;
  debug(...msg: any[]): void;
  info(msg: string, data: { [_: string]: any }): void;
  info(...msg: any[]): void;
  warn(msg: string, data: { [_: string]: any }): void;
  warn(...msg: any[]): void;
  error(msg: string, data: { [_: string]: any }): void;
  error(...msg: any[]): void;
  critical(msg: string, data: { [_: string]: any }): void;
  critical(...msg: any[]): void;
  getReplacements(msg: string): string[];
  setLogLevel(level: LogLevel): void;
}

export type LogLevel = "LOG" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export const LogLevelHirachy = {
  LOG: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5,
};
