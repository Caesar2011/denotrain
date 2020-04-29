import { Server, Router } from "../../mod.ts";
import { TrainTicket } from "../../middleware/auth.ts";

const app = new Server({port: 3001});
const router = new Router();

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
