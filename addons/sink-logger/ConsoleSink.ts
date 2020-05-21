import { Sink } from "./SinkLogger.ts";
import { LogLevel } from "./deps.ts";
import {
  yellow,
  gray,
  white,
  red,
  bold,
} from "./deps.ts";

export class ConsoleSink implements Sink {
  private readonly fmt: { [_: string]: (str: string) => string } = {
    LOG: gray,
    DEBUG: gray,
    INFO: white,
    WARN: yellow,
    ERROR: red,
    CRITICAL: (str: string) => bold(red(str)),
  };

  emit(logLevel: LogLevel, prefix: string, msg: any[]): void {
    console.log(this.fmt[logLevel](prefix), ...msg);
  }
}
