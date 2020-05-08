# denotrain

This is a web server library inspired by [expressJS](https://expressjs.com) written for node. It supports routers, query parameters and url parameters. The library is desired to use with deno.

![Deno Train Logo](./doc/denotrain-scaled.png)

## Features

 - [Getting Started](./doc/getting_started.md)
 - Responses
 - Routing
 - Body, query and parameters
 - Custom Middleware
   - Static
   - Logging
   - User Management
   - Entity Validation (TODO)
   - Database Connector (TODO)
   - Permission System (TODO)
 - Extend application and requests
 - View Engines / Templates

## Example

Run this example with `deno run --allow-net=127.0.0.1 https://deno.land/x/denotrain@v0.2.0/example/routers/example.ts`.

```ts
import { Application, Router } from "https://deno.land/x/denotrain@v0.2.0/mod.ts";

// Create a new application and specify port
const app = new Application({port: 3001});
// Optional: Generate router and hook routes to it
const router = new Router();

// Middleware 
app.use((ctx) => {
  // Multiple cookie opterations are currently not supported
  // by deno itself, this will change in the future
  // https://github.com/denoland/deno/pull/4840

  // Add data to the response object and return undefined
  // -> Still passed to other handlers
  ctx.res
    .setCookie("user.session", "qwertz", {maxAge: 60 * 60 * 24})
    .setCookie("a", "123", {maxAge: 60 * 60 * 24})
    .setCookie("b", "456", {maxAge: 60 * 60 * 24})
    .deleteCookie("user.session");
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

// Run the application on the specified port
await app.run();
```

## Documentation

View documentation on the [official documentation website](https://doc.deno.land/https/raw.githubusercontent.com/Caesar2011/denotrain/master/mod.ts).
