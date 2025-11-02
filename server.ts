import { fastify } from "fastify";

const app = fastify();

app.listen({ port: 3100, host: "0.0.0.0" }).then(() => {
  console.log("HTTP Server rodando em http://localhost:3100");
});
