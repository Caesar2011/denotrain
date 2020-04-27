import { Server, Router } from "../../mod.ts";
import { TrainStatic } from "../../middleware/static.ts";
import { TrainLogger } from "../../middleware/logger.ts";

const app = new Server({port: 3001});
const router = new Router();

app.use('/static', new TrainStatic('./public'));
app.use(new TrainLogger());

app.get('/', (req) => {
  req.setMimeType("text/html");
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
