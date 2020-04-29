# denotrain

This is a web server library inspired by [expressJS](https://expressjs.com) written for node. It supports routers, query parameters and url parameters. The library is desired to use with deno.

## Example

Run this example with `deno run --allow-net=127.0.0.1 https://deno.land/x/denotrain@v0.2.0/example/routers/example.ts`.

```ts
import { Application, Router } from "../../mod.ts";

const app = new Application({port: 3001});
const router = new Router();

app.use((ctx) => {
  ctx.res
    .setCookie("user.session", "qwertz", {maxAge: 60 * 60 * 24})
    .setCookie("a", "123", {maxAge: 60 * 60 * 24})
    .setCookie("b", "456", {maxAge: 60 * 60 * 24})
    .deleteCookie("user.session");
  return;
});

router.get("/", (ctx) => {
  //return "This is the admin interface!";
  return new Promise((resolve) => resolve("This is the admin interface! ")); 
});
router.get("/edit", async (ctx) => {
  return "This is an edit mode!"; 
});

app.get('/', (ctx) => {
  return "Hello World!"
});
app.use('/admin', router);
app.get('/:id', (ctx) => {
  return "Hello World with ID: " + ctx.req.param.id
});

app.run();
```

## Documentation

View documentation on the [official documentation website](https://doc.deno.land/https/raw.githubusercontent.com/Caesar2011/denotrain/master/mod.ts).