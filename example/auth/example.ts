import {
  Application, TrainTicket, DejsEngine, Obj,
  TicketContext, MemoryStorage, MemoryAuthenticator,
  TrainLogger, TrainStatic
} from "./deps.ts";

const app = new Application<Obj, TicketContext>({
  port: 3001,
  viewEngine: new DejsEngine("./templates"),
});

app.use(new TrainLogger());
app.use("/static", new TrainStatic("./public"));

const tickets = new TrainTicket(new MemoryStorage());
tickets.addAuthenticator('mem-auth', new MemoryAuthenticator());

app.use(tickets.sessionMiddleware);

app.get("/", async (ctx) => {
  await ctx.res
    .render("index.ejs", { name: ctx.data.user?.displayName });
  return true;
});

app.get("/login", async (ctx) => {
  await ctx.res
    .render("login.ejs");
  return true;
});
app.post("/login", tickets.doLoginMiddleware, async (ctx) => {
  ctx.res
    .setStatus(302)
    .addHeader("Location", "/");
  return true;
});

app.get("/register", async (ctx) => {
  await ctx.res
    .render("register.ejs");
  return true;
});
app.post("/register", async (ctx) => {
  const username = ctx.req.body.username;
  const password = ctx.req.body.password;
  const mail = ctx.req.body.mail;
  ctx.data.register(username, password, 'mem-auth', {emails: [mail]});
  ctx.res
    .setStatus(302)
    .addHeader("Location", "/");
  return true;
});

app.get("/restricted", tickets.isLoggedInMiddleware, async (ctx) => {
  await ctx.res
    .render("index.ejs", { name: ctx.data.user?.displayName });
  return true;
});

await app.run();
