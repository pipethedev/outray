import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../../../db";
import { authTokens } from "../../../db/app-schema";
import { cliOrgTokens } from "../../../db/auth-schema";

export const Route = createFileRoute("/api/tunnel/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { token } = body;

          if (!token) {
            return json(
              { valid: false, error: "Missing Auth Token" },
              { status: 400 },
            );
          }

          // Try CLI org token first
          const cliOrgToken = await db.query.cliOrgTokens.findFirst({
            where: and(
              eq(cliOrgTokens.token, token),
              gt(cliOrgTokens.expiresAt, new Date()),
            ),
            with: {
              organization: true,
            },
          });

          if (cliOrgToken) {
            // Update last used
            await db
              .update(cliOrgTokens)
              .set({ lastUsedAt: new Date() })
              .where(eq(cliOrgTokens.id, cliOrgToken.id));

            return json({
              valid: true,
              userId: cliOrgToken.userId,
              organizationId: cliOrgToken.organizationId,
              organization: {
                id: cliOrgToken.organization.id,
                name: cliOrgToken.organization.name,
                slug: cliOrgToken.organization.slug,
              },
              tokenType: "org",
            });
          }

          // Fall back to legacy auth tokens
          const tokenRecord = await db.query.authTokens.findFirst({
            where: eq(authTokens.token, token),
            with: {
              organization: true,
            },
          });

          if (!tokenRecord) {
            return json(
              { valid: false, error: "Invalid Auth Token" },
              { status: 401 },
            );
          }

          await db
            .update(authTokens)
            .set({ lastUsedAt: new Date() })
            .where(eq(authTokens.id, tokenRecord.id));

          return json({
            valid: true,
            userId: tokenRecord.userId,
            organizationId: tokenRecord.organizationId,
            organization: {
              id: tokenRecord.organization.id,
              name: tokenRecord.organization.name,
              slug: tokenRecord.organization.slug,
            },
            tokenType: "legacy",
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
