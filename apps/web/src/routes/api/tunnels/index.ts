import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { tunnels, subdomains } from "../../../db/app-schema";
import { redis } from "../../../lib/redis";

export const Route = createFileRoute("/api/tunnels/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const userTunnels = await db
          .select({
            id: tunnels.id,
            url: tunnels.url,
            name: tunnels.name,
            userId: tunnels.userId,
            lastSeenAt: tunnels.lastSeenAt,
            createdAt: tunnels.createdAt,
            updatedAt: tunnels.updatedAt,
            subdomain: subdomains.subdomain,
          })
          .from(tunnels)
          .leftJoin(subdomains, eq(tunnels.id, subdomains.tunnelId))
          .where(eq(tunnels.userId, session.user.id));

        const tunnelsWithStatus = await Promise.all(
          userTunnels.map(async (tunnel) => {
            const isOnline = await redis.exists(
              `tunnel:online:${tunnel.subdomain}`,
            );
            return {
              id: tunnel.id,
              url: tunnel.url,
              userId: tunnel.userId,
              name: tunnel.name,
              isOnline,
              lastSeenAt: tunnel.lastSeenAt,
              createdAt: tunnel.createdAt,
              updatedAt: tunnel.updatedAt,
            };
          }),
        );

        const activeTunnels = tunnelsWithStatus.filter((t) => t.isOnline);

        return json({ tunnels: activeTunnels });
      },
    },
  },
});
