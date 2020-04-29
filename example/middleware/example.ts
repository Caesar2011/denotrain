import { Application, Router } from "../../mod.ts";
import { TrainStatic } from "../../middleware/static/mod.ts";
import { TrainLogger } from "../../middleware/logger/mod.ts";

const app = new Application({port: 3001});

app.use('/static', new TrainStatic('./public'));
app.use(new TrainLogger());

app.get('/', (ctx) => {
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

app.run();
