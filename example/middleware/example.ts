import {
  Application,
  TrainStatic,
  TrainLogger,
  LoggerContext,
} from "./deps.ts";

const app = new Application<LoggerContext>({ port: 3001 });

app.use(new TrainLogger());
app.use("/static", new TrainStatic("./public"));

app.get("/", (ctx) => {
  ctx.app.data.log("Create a log message by yourself!");
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
