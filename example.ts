import { Server, Router } from "./mod.ts";

const app = new Server({port: 3000});
const router = new Router();

router.use((req) => {
  console.log(req.cookies);
  return null;
});

router.get("/", (req) => {
  //return "This is the admin interface!";
  return new Promise((resolve) => resolve("This is the admin interface!")); 
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
