# denotrain

This is a web server library inspired by [expressJS](https://expressjs.com) written for node. It supports routers, query parameters and url parameters. The library is desired to use with deno.

## Example

Run this example with `deno run --allow-net=127.0.0.1 https://raw.githubusercontent.com/Caesar2011/denotrain/v0.0.1/example.ts`.

```ts
import { Server, Router } from "./mod.ts";

const app = new Server({port: 3000});
const router = new Router();

router.get("/", (req) => {
  //return "This is the admin interface!";
  return new Promise((resolve) => resolve("This is the admin interface!")); 
})
router.get("/edit", (req) => {
  return new Promise((resolve) => resolve("This is an edit mode!")); 
})

app.get('/', (req) => {
  return "Hello World!"
});
app.use('/admin', router);
app.get('/:id', (req) => {
  return "Hello World with ID: " + req.param.id
});

app.run();
```

## Documentation

View documentation on the [official documentation website](https://doc.deno.land/https/raw.githubusercontent.com/Caesar2011/denotrain/master/mod.ts).