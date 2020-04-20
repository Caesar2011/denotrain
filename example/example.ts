import { Server, Router, ClientSuccess } from "../mod.ts";

const app = new Server({port: 3001});
const router = new Router();

app.use((req) => {
  req.response
    .setCookie("user.session", "qwertz", {maxAge: 60 * 60 * 24})
    .setCookie("a", "123", {maxAge: 60 * 60 * 24})
    .setCookie("b", "456", {maxAge: 60 * 60 * 24})
    //.deleteCookie("qwertz");
  return;
});

router.get("/", (req) => {
  //return "This is the admin interface!";
  return new Promise((resolve) => resolve("This is the admin interface! ")); 
})
router.get("/edit", async (req) => {
  return "This is an edit mode!"; 
})

app.get('/', (req) => {
  return "Hello World!"
});
app.use('/admin', router);
app.get('/:id', (req) => {
  return "Hello World with ID: " + req.param.id
});

app.run();
