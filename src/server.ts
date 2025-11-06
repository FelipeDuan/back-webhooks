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
import { captureWebhook } from "./routes/capture-webhook";
import { deleteWebhook } from "./routes/delete-webhook";
import { getWebhookById } from "./routes/get-webhook-by-id";
import { getWebhooks } from "./routes/get-webhooks";
import { env } from "./utils/env";
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
app.register(getWebhookById);
app.register(deleteWebhook);
app.register(captureWebhook);

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  if (env.NODE_ENV === "dev") {
    app.log.info(`Docs disponiveis em ${address}/docs`);
  }
});
