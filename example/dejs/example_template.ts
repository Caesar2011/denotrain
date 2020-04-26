import { Server, Router } from "../../mod.ts";
import { DejsEngine } from "../../template_engines/dejs.ts";

const app = new Server({
  port: 3001,
  viewEngine: new DejsEngine('./templates')
});
const router = new Router();

app.get('/home', async (req) => {
  await req.render('index.ejs', {name: 'World'});
  return true;
});

app.run();