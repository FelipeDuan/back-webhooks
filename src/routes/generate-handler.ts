import { inArray } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const generateHandler: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/api/generate",
    {
      schema: {
        tags: ["Webhooks"],
        summary: "Gerar um handlers em TypeScript",
        body: z.object({
          webhookIds: z.array(z.string()),
        }),
        response: {
          201: z.object({
            code: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { webhookIds } = request.body;

      const result = await db
        .select({
          body: webhooks.body,
        })
        .from(webhooks)
        .where(inArray(webhooks.id, webhookIds));

      const webhooksBodies = result.map((webhook) => webhook.body).join("\n\n");

      const { text } = generateText({
        model: google("gemini-2.5-flash"),
        prompt: `
        Here’s a ready-to-paste **English prompt** that makes the model return a single TypeScript file (TS + Zod) that validates and handles multiple webhook events.

        ---

        ## SYSTEM / ROLE

        You are a senior TypeScript engineer specializing in input validation with **Zod** and webhook processing.

        ## GOAL

        Return a **single self-contained TypeScript file** that defines:

        1. Zod schemas for multiple webhook **event types** (each with its own schema and a common discriminator type),
        2. a **discriminated union** for all events,
        3. a **batch schema** for { events: [...] }, and
        4. a function handleWebhookBatch(input: unknown) that validates and routes each event to a type-safe handler.

        ## INPUT (from user)

        You will receive a JSON request body that contains multiple webhook events. Example structure (the user may replace/extend these types/fields as needed):

        """
        ${webhooksBodies}
        """

        ## HARD REQUIREMENTS

        * Use **TypeScript** (ESM) and **Zod** only. strict: true. No external I/O or network calls.
        * Define **one schema per event type** and combine them using z.discriminatedUnion("type", [...]).
        * Define batchSchema = z.object({ events: z.array(eventUnionSchema).min(1) }).
        * handleWebhookBatch(input: unknown) must:

          * Validate input using batchSchema;
          * Iterate over validated events;
          * **Route by type** to dedicated handlers (handleCreated, handleDelivered, handleDeleted, etc.) with **narrowed types** inferred from Zod;
          * **Aggregate per-event errors** without crashing the whole batch;
          * Return:

            ts
            { ok: true; processed: number; errors: Array<{ index: number; type?: string; error: string }> }
            
        * Export all **schemas**, **inferred types** (z.infer<typeof ...>), and handleWebhookBatch.
        * Validate ISO datetime strings via Zod refinements (don’t construct Date inside schemas unless necessary).
        * Use a **routing table**: const handlers: Record<EventType, (e: EventUnionSubset) => void | Promise<void>>.
        * Keep the code **clean and commented just enough** to show where observability/logging could be added.
        * **Output code only** (no explanations, no markdown fences).
        `,
      });

      return reply.status(201).send({ code: text });
    }
  );
};
