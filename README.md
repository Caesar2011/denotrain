# denotrain

This is a web server library inspired by [expressJS](https://expressjs.com) written for node. It supports routers, query parameters and url parameters. The library is desired to use with deno.

![Deno Train Logo](./doc/denotrain-scaled.png)

## Features

 - [Getting Started!](./doc/getting_started.md)
 - [Request handlers & lifecycle](./doc/handlers.md)
 - [Responses](./doc/responses.md)
 - Routing (see also "Request handlers & lifecycle")
 - [Body, query and parameters](./doc/parameters.md)
 - [Cookies](./doc/cookies.md)
 - View Engines / Templates
 - Logging
 - Extend application and requests
 - Custom Middleware
   - Static
   - Request Logging
   - User Management
   - Entity Validation (TODO)
   - Database Connector (TODO)
   - Permission System (TODO)

## Example

Run this example on port 3000 with `deno run --allow-net=0.0.0.0 https://deno.land/x/denotrain@v0.5.3/example/routers/example.ts`.

Try the following routes:

 - `GET /`
 - `GET /doesnotexist`
 - `GET /admin`
 - `GET /17`
 - `GET /admin/edit`
 - `POST /formtest`

More examples are in this repository under `/examples`.

```ts
import { Application, Router } from "https://deno.land/x/denotrain@v0.5.3/mod.ts";

// Create a new application (port defaults to 3000, hostname to 0.0.0.0)
const app = new Application();
// Optional: Generate router and hook routes to it
const router = new Router();

// Middleware 
app.use((ctx) => {
  // Add data to the response object and return undefined
  // -> Still passed to other handlers

  // Add cookies to the deno train cookie handler
  ctx.cookies["user.session"] = "qwertz";
  ctx.cookies["a"] = "123";
  ctx.cookies["b"] = "456";
  delete ctx.cookies["user.session"];
  return;
});

// this will only listen on GET requests
router.get("/", (ctx) => {
  // Returning a string, JSON, Reader or Uint8Array automatically sets
  // Content-Type header and no further router will match
  return new Promise((resolve) => resolve("This is the admin interface!")); 
});
router.get("/edit", async (ctx) => {
  return "This is an edit mode!"; 
});

app.get("/", (ctx) => {
  // Returning a json
  return {"hello": "world"};
});

// Hook up the router on "/admin". The routes are now
// available on "/admin" and "/admin/edit"
app.use("/admin", router);

app.get("/:id", (ctx) => {
  // Use url parameters
  return "Hello World with ID: " + ctx.req.params.id
});

// Make a post request; try it with sending json or url-form-encoded
// and a corresponding Content-Type header
app.post("/formtest", async (ctx) => {
  return ctx.req.body;
});

// Run the application on the specified port
await app.run();
```

## App Parameters

The constructor of `Application` accepts an object with options. All options are optional, and defaults are set for many values.

 - **`port`** (`number`, *default: `3000`*) Port of the server.

 - **`hostname`** (`string`, *default: `0.0.0.0`*) Hostname of the server. You also need to permit Deno to serve on this address by `--allow-net=0.0.0.0`.

 - **`certFile`** (`string`) Path to the HTTPS public certificate. If `certFile` and `keyFile` are present, Denotrain will automatically serve the server with HTTPS. You also need to permit Deno to access this file by `--allow-read=path/to/file.crt`

 - **`keyFile`** (`string`) Path to the HTTPS private key. You also need to permit Deno to access this file by `--allow-read=path/to/file.key`.

 - **`additionalServers`** (`ListenOptions[]`, *default: `[]`*) An array of objects, each may contain any of the four parameters listed above. It can be used to serve the application on additional servers.

 - **`logger`** (`Logger`, *default: `new SinkLogger([new ConsoleSink()])`*) An array of objects, each may contain any of the four parameters listed above. It can be used to serve the application on additional servers.

 - **`logLevel`** (`"LOG" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL"`, *default: `"LOG"`*) All logs that are higher or equal to the specified log level are output. After initializing the application, the log level is set to the specified value. For production environments, `"INFO"` or `"WARN"` is recommended. See the documentation for more information.

 - **`cookieKey`** (`string`, *default: `"train.ticket"`*) The ticket that identifies the client in the `CookieStorage` is stored as an HTTP cookie. The key of that HTTP cookie is specified here.

 - **`cookieStorage`** (`CookieStorage`, *default: `new MemoryCookieStorage()`*) The storage of the cookies in which the keys and their associated values are stored. The default `MemoryCookieStorage` stores the values only temporarily until a server restart and is therefore not recommended for productive use.

 - **`cookieOptions`** (`CookieOptions`, *default: `{ maxAge: 60 * 60 * 24 }`*) Each time the HTTP cookie is set for the `CookieStorage`, HTTP cookie options are set. These can be specified here. More details can be found in the [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) or [in the Denotrain documentation](./doc/cookies.md).

 - **`cookieSecret`** (`string`, *default: `"changeThis"`*) To prevent session hijacking, the randomly generated user UUID is mixed with this secret. This prevents simple manipulation of the cookie. This secret should be changed, even in development environments. Furthermore, the secret should not be known to the users of the system.

## Documentation

View documentation on the [official documentation website](https://doc.deno.land/https/deno.land/x/denotrain@master/mod.ts).
