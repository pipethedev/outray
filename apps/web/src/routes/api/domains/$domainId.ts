import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { domains } from "../../../db/app-schema";

export const Route = createFileRoute("/api/domains/$domainId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const { domainId } = params;

        if (!domainId) {
          return json({ error: "Domain ID required" }, { status: 400 });
        }

        // First check if the domain exists and get its organizationId
        const domain = await db.query.domains.findFirst({
          where: eq(domains.id, domainId),
        });

        if (!domain) {
          return json({ error: "Domain not found" }, { status: 404 });
        }

        // Check if user has access to the organization
        const organizations = await auth.api.listOrganizations({
          headers: request.headers,
        });

        const hasAccess = organizations.find(
          (org) => org.id === domain.organizationId,
        );

        if (!hasAccess) {
          return json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.delete(domains).where(eq(domains.id, domainId)).returning();

        return json({ message: "Domain deleted successfully" });
      },
    },
  },
});
