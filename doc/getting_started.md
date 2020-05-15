# Getting Started

This script explains the basic possibilities of denotrain. All imports intended for the public are in the file `/mod.ts`. Additional official middleware can be found in `/middleware/<name>/mod.ts`.

First an application is created. Specifying a port is optional (3000 by default). In addition, further app-wide parameters can be specified, such as a render engine for HTML templates or a cookie store. An app root is optional and can be used for various middleware as a root directory for relative paths. 

Under `Application`, so-called `RequestHandler` can be mounted.This can either be an (async) function or a `Router`. From the class `Router` should be inherited for own middleware.

## Basic features at a glance

```ts
import { Application, Router } from "https://deno.land/x/denotrain@v0.4.3/mod.ts";

// Create a new application and specify port
const app = new Application({port: 3001});
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
  // Use url parameters and return a string
  return "Hello World with ID: " + ctx.req.params.id
});

// Run the application on the specified port
await app.run();
```
