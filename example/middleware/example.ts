import {
  Application,
  TrainStatic,
  TrainLogger,
} from "./deps.ts";

const app = new Application(
  { port: 3001, hostname: "127.0.0.1" },
);

app.use(new TrainLogger());
app.use("/static", new TrainStatic("./public"));

app.get("/", (ctx) => {
  ctx.app.logger.debug("Create a log message by yourself!");
  ctx.res
    .setMimeType("text/html");
  return `
  <html>
    <head><meta charset="utf8"></head>
    <body>
      <img src="/static/image.jpg" alt="cute dog">
      <a href="/static/image.jpg">View image</a>
    </body>
  </html>
  `;
});

await app.run();
