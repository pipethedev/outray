import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { apiKeys } from "../../../db/app-schema";

export const Route = createFileRoute("/api/tunnel/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { apiKey } = body;

          if (!apiKey) {
            return json(
              { valid: false, error: "Missing API key" },
              { status: 400 },
            );
          }

          const keyRecord = await db.query.apiKeys.findFirst({
            where: eq(apiKeys.key, apiKey),
            with: {
              user: true,
            },
          });

          if (!keyRecord) {
            return json(
              { valid: false, error: "Invalid API key" },
              { status: 401 },
            );
          }

          await db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, keyRecord.id));

          return json({
            valid: true,
            userId: keyRecord.userId,
            user: {
              id: keyRecord.user.id,
              name: keyRecord.user.name,
              email: keyRecord.user.email,
            },
          });
        } catch (error) {
          console.error("Error in /api/tunnel/auth:", error);
          return json(
            {
              valid: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
