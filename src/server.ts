import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./env";
import { getWebhooks } from "./routes/get-webhooks";
import { loggerConfig } from "./utils/logger";

const app = fastify({
  logger: loggerConfig,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

if (env.NODE_ENV === "dev") {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Webhook Inspector API",
        description: "API para capturar e inspecionar requests de Webhooks",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(ScalarApiReference, {
    routePrefix: "/docs",
  });
}

app.register(getWebhooks);

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  if (env.NODE_ENV === "dev") {
    app.log.info(`Docs disponiveis em ${address}/docs`);
  }
});
