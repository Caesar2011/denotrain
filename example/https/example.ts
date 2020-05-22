import { Application } from "./deps.ts";

// Created a self-signed cert-key pair with
// openssl req  -nodes -new -x509 -keyout server.key -out server.cert
// https://serverfault.com/questions/366372/is-it-possible-to-generate-rsa-key-without-pass-phrase

const app = new Application({
  port: 3000,
  hostname: "0.0.0.0",
  certFile: "./data/server.cert",
  keyFile: "./data/server.key",
});

app.get("/", (ctx) => {
  return { "https": "works" };
});

app.run();
