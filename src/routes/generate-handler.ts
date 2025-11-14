import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { inArray } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "@/db";
import { webhooks } from "@/db/schema";

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

      const { text } = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `
        You are a specialized code generation engine. Your only purpose is to output raw TypeScript code.

        ## GOAL
        Generate a single, self-contained TypeScript file (TS + Zod) to validate and handle the provided webhook events.

        ## INPUT DATA (JSON SAMPLES)
        """
        ${webhooksBodies}
        """

        ## TECHNICAL REQUIREMENTS
        1. **Strict TypeScript & Zod**: Use strict: true.
        2. **Schemas**: Define one Zod schema per event type and one discriminated union for all events.
        3. **Batch Handling**: Define a \`batchSchema\` and a \`handleWebhookBatch(input: unknown)\` function.
        4. **Logic**: 
           - Validate input with \`batchSchema\`.
           - Iterate and route by type to specific handler functions (e.g., \`handleCreated\`).
           - Aggregate errors without crashing the batch.
           - Return structure: \`{ ok: true; processed: number; errors: Array<{ index: number; error: string }> }\`.
        5. **Exports**: Export all schemas, inferred types, and the main function.

        ## IMPORTANT OUTPUT FORMATTING RULES
        - **DO NOT** use Markdown code blocks (no \`\`\`typescript or \`\`\`).
        - **DO NOT** include introductory text, explanations, or conclusions.
        - **DO NOT** include the text "Here is the code".
        - **START** the output directly with the \`import\` statements.
        - **END** the output directly with the last closing brace.
        - Output **RAW TEXT ONLY**.
        `,
      });

      return reply.status(201).send({ code: text });
    }
  );
};
