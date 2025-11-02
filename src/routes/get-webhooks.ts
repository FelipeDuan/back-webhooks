import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const getWebhooks: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/api/webhooks",
    {
      schema: {
        tags: ["Webhooks"],
        summary: "Listar webhooks",
        querystring: z.object({
          limit: z.coerce.number().min(1).max(100).default(20),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              method: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const { limit } = request.query;

      return [
        {
          id: "123",
          method: "POST",
        },
      ];
    }
  );
};
