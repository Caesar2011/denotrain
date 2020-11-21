export { LogLevelHirachy } from "../../src/Logger.ts";
import { Logger as lo, LogLevel as ll } from "../../src/Logger.ts";
export type Logger = lo;
export type LogLevel = ll;
export { replaceAll } from "../../src/utils/string.ts";

export {
  yellow,
  gray,
  white,
  red,
  bold,
} from "https://deno.land/x/std@0.78.0/fmt/colors.ts";
