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

Run this example on port 3000 with `deno run --allow-net=0.0.0.0 https://deno.land/x/denotrain@v0.5.0/example/routers/example.ts`.

Try the following routes:

 - `GET /`
 - `GET /doesnotexist`
 - `GET /admin`
 - `GET /17`
 - `GET /admin/edit`
 - `POST /formtest`

More examples are in this repository under `/examples`.

```ts
import { Application, Router } from "https://deno.land/x/denotrain@v0.5.0/mod.ts";

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

## Documentation

View documentation on the [official documentation website](https://doc.deno.land/https/deno.land/x/denotrain@master/mod.ts).
