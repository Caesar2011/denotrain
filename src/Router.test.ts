import { assertEquals } from "https://deno.land/x/std@0.78.0/testing/asserts.ts";
import { ServerRequest } from "../deps.ts";
import { Application } from "./Application.ts";
import { BufReader } from "https://deno.land/x/std@0.78.0/io/bufio.ts";
import { StringReader } from "https://deno.land/x/std@0.78.0/io/readers.ts";
function generateRequest(
  method: string,
  url: string,
  headers: [string, string][] = [],
): ServerRequest {
  const serverReq = new ServerRequest();
  serverReq.method = "GET";
  serverReq.url = url;
  serverReq.headers = new Headers(headers);
  serverReq.respond = () => new Promise<void>((resolve) => resolve());

  return serverReq;
}

Deno.test("Router with param matches", async () => {
  const paths = {
    "/t/user1": "user1",
    "/t/user-1": "user-1",
    "/t/user_1": "user_1",
    "/t/user$1": "user$1",
    "/t/~user1": "~user1",
    "/t/user1!home": "user1!home",
    "/t/user1|home": "user1|home",
  };

  const app = new Application();
  app.get("/t/:slug", (ctx) => {
    return ctx.req.params;
  });

  for (const [url, slug] of Object.entries(paths)) {
    const req = generateRequest("GET", url);
    const ctx = await app.handleRequest(req);
    assertEquals(ctx.res.body, { slug });
  }
});

Deno.test('Router with "_" in param name matches', async () => {
  const paths = {
    "/t/user1": "user1",
  };

  const app = new Application();
  app.get("/t/:user_slug", (ctx) => {
    return ctx.req.params;
  });

  for (const [url, user_slug] of Object.entries(paths)) {
    const req = generateRequest("GET", url);
    const ctx = await app.handleRequest(req);
    assertEquals(ctx.res.body, { user_slug });
  }
});

Deno.test("Router with no matches", async () => {
  const paths = [
    "/temp/my-post/nested",
    "/t/my-post/nested",
    "/temp/my-post",
  ];

  const app = new Application();
  app.get("/t/:path", (ctx) => {
    return ctx.req.params;
  });

  for (const url of paths) {
    const req = generateRequest("GET", url);
    const ctx = await app.handleRequest(req);
    assertEquals(ctx.res.status, 404, `for ${url}`);
  }
});

Deno.test("Router with query parameter", async () => {
  const paths = {
    "/test": {},
    "/test?param": { param: "" },
    "/test?param=yes": { param: "yes" },
    "/test?param=500": { param: 500 },
    "/test?param=true": { param: true },
    "/test?param=false": { param: false },
    "/test?param=null": { param: "null" },
    "/test?param=null&other=420": { param: "null", other: 420 },
  };

  const app = new Application();
  app.get("/t", (ctx) => {
    return ctx.req.query;
  });

  for (const [url, query] of Object.entries(paths)) {
    const req = generateRequest("GET", url);
    const ctx = await app.handleRequest(req);
    assertEquals(ctx.req.query, query, `for ${url}`);
  }
});

Deno.test("Router with body parameter", async () => {
  const paths: {
    [_: string]: { body: string; res: any; headers: [string, string][] };
  } = {
    "/test?jsonEmpty": {
      body: "",
      res: {},
      headers: [["Content-Type", "application/json"]],
    },
    "/test?jsonSuccess": {
      body: '{"json": "success"}',
      res: { json: "success" },
      headers: [["Content-Type", "application/json"]],
    },
    "/test?jsonInvalid": {
      body: "{invalid json",
      res: {},
      headers: [["Content-Type", "application/json"]],
    },
    "/test?encodedEmpty": {
      body: "",
      res: {},
      headers: [["Content-Type", "application/x-www-form-urlencoded"]],
    },
    "/test?encodedSuccess": {
      body: "url=123&encoded=works",
      res: { url: 123, encoded: "works" },
      headers: [["Content-Type", "application/x-www-form-urlencoded"]],
    },
    "/test?encodedInvalid": {
      body: "weird",
      res: { weird: "" },
      headers: [["Content-Type", "application/x-www-form-urlencoded"]],
    },
  };

  const app = new Application();
  app.get("/test", async (ctx) => {
    return ctx.req.body;
  });

  for (const [url, data] of Object.entries(paths)) {
    const req = generateRequest("GET", url, data.headers);
    req.r = new BufReader(new StringReader(data.body));
    req.headers.append("Content-Length", "" + data.body.length);
    const ctx = await app.handleRequest(req);
    assertEquals(ctx.req.body, data.res, `for ${url}`);
  }
});
