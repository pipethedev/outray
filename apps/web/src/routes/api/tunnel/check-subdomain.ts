import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { tunnels } from "../../../db/app-schema";

export const Route = createFileRoute("/api/tunnel/check-subdomain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { subdomain, userId } = body;

          if (!subdomain) {
            return json(
              { allowed: false, error: "Missing subdomain" },
              { status: 400 },
            );
          }

          const existingTunnel = await db.query.tunnels.findFirst({
            where: eq(tunnels.subdomain, subdomain),
          });

          if (existingTunnel) {
            if (userId && existingTunnel.userId === userId) {
              return json({ allowed: true, type: "owned" });
            }
            return json({ allowed: false, error: "Subdomain already taken" });
          }

          return json({ allowed: true, type: "available" });
        } catch (error) {
          console.error("Error in /api/tunnel/check-subdomain:", error);
          return json(
            {
              allowed: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
