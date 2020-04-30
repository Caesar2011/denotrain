export function parseCookieHeader(
  headerValue: string,
): { [_: string]: string } {
  const res: { [_: string]: string } = {};
  headerValue.split("; ").forEach((cookieStr) => {
    const [key, val] = cookieStr.split("=");
    res[key] = val;
  });
  return res;
}

export function generateCookieHeader(
  key: string,
  value: string,
  options: CookieOptions,
): [string, string] {
  if (options.hasOwnProperty("expires")) {
    value += "; Expires=" + new Date(options.expires || 0).toUTCString();
  }
  if (options.hasOwnProperty("maxAge")) {
    value += "; Max-Age=" + options.maxAge;
  }
  if (options.hasOwnProperty("domain")) {
    value += "; Domain=" + options.domain;
  }
  if (options.hasOwnProperty("path")) {
    value += "; Path=" + options.path;
  }
  if (options.secure) {
    value += "; Secure";
  }
  if (options.httpOnly) {
    value += "; HttpOnly";
  }
  if (options.hasOwnProperty("sameSite")) {
    value += "; SameSite=" + options.sameSite;
  }
  return ["Set-Cookie", `${key}=${value}`];
}

export interface CookieOptions {
  expires?: number;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
