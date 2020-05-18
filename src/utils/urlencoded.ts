export type UrlEncodedValue = string | number | boolean;

export function decodeUrlEncoded(
  qs: string,
  options?: {
    maxKeys?: number;
    sep?: string;
    eq?: string;
    recursive?: boolean;
    parseTypes?: boolean;
  },
): { [_: string]: UrlEncodedValue | UrlEncodedValue[] } {
  const sep: string = options?.sep || "&";
  const eq: string = options?.eq || "=";
  const maxKeys: number = options?.maxKeys || 0;
  //const recursive: boolean = options?.recursive || true;
  const parseTypes: boolean = options?.parseTypes || true;

  const res: { [_: string]: UrlEncodedValue | UrlEncodedValue[] } = {};

  if (qs.length === 0) {
    return res;
  }

  const regexp = /\+/g;
  let qsarr = qs
    .split(sep)
    // maxKeys <= 0 means that we should not limit keys count
    .splice(0, (maxKeys > 0) ? maxKeys : Infinity)
    .map((val) => val.replace(regexp, "%20"));

  for (const x of qsarr) {
    const idx = x.indexOf(eq);

    let kstr, vstr;
    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = "";
    }

    const k = decodeURIComponent(kstr);
    const v = decodeURIComponent(vstr);

    if (!res.hasOwnProperty(k)) {
      res[k] = parseTypes ? parseValue(v) : v;
    } else if (Array.isArray(res[k])) {
      (res[k] as UrlEncodedValue[]).push(v);
    } else {
      res[k] = [res[k] as UrlEncodedValue, v];
    }
  }

  return res;
}

export function parseValue(value: string): UrlEncodedValue {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value.match(/^[0-9]+$/)) {
    return parseInt(value, 10);
  }
  return value;
}
