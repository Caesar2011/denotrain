import { Application, Router } from "../../mod.ts";

const app = new Application({ port: 3001 });
const router = new Router();

app.use((ctx) => {
  ctx.res
    .setCookie("user.session", "qwertz", { maxAge: 60 * 60 * 24 })
    .setCookie("a", "123", { maxAge: 60 * 60 * 24 })
    .setCookie("b", "456", { maxAge: 60 * 60 * 24 })
    .deleteCookie("user.session");
  return;
});

router.get("/", (ctx) => {
  //return "This is the admin interface!";
  return new Promise((resolve) => resolve("This is the admin interface!"));
});
router.get("/edit", async (ctx) => {
  return "This is an edit mode!";
});

app.get("/", (ctx) => {
  return "Hello World!";
});
app.post("/", async (ctx) => {
  return ctx.req.body;
});

app.use("/admin", router);
app.get("/:id", (ctx) => {
  return "Hello World with ID: " + ctx.req.param.id;
});

app.run();
