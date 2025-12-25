import { redis } from "./lib/redis";
import { clickhouse } from "./lib/clickhouse";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS active_tunnel_snapshots
(
    ts DateTime,
    active_tunnels UInt32
)
ENGINE = MergeTree
PARTITION BY toDate(ts)
ORDER BY ts
TTL ts + INTERVAL 90 DAY;
`;

async function connectRedis() {
  await redis.connect();
  console.log("Connected to Redis");
}

async function connectClickHouse() {
  try {
    await clickhouse.ping();
    console.log("Connected to ClickHouse");
    await clickhouse.command({
      query: CREATE_TABLE_SQL,
    });
    console.log("ClickHouse table ensured");
  } catch (error) {
    console.error("Failed to connect to ClickHouse", error);
    process.exit(1);
  }
}

let isSampling = false;

async function sampleActiveTunnels() {
  if (isSampling) {
    console.warn("Skipping sample: previous run still active");
    return;
  }
  isSampling = true;

  try {
    console.log("Sampling active tunnels...");
    const now = new Date();
    now.setSeconds(0, 0);
    const ts = now;

    let totalCount = 0;

    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        "org:*:active_tunnels",
        "COUNT",
        100,
      );
      cursor = nextCursor;

      if (keys.length === 0) continue;

      // Pipeline: Get counts for each org
      const pipeline = redis.pipeline();
      for (const key of keys) {
        pipeline.zcard(key);
      }
      const results = await pipeline.exec();

      if (!results) continue;

      for (const [err, count] of results as [Error | null, number][]) {
        if (err) continue;
        totalCount += count;
      }
    } while (cursor !== "0");

    console.log("Active tunnels:", totalCount);

    // Insert into ClickHouse
    try {
      await clickhouse.insert({
        table: "active_tunnel_snapshots",
        values: [
          {
            ts: ts,
            active_tunnels: totalCount,
          },
        ],
        format: "JSONEachRow",
      });
      console.log(`Inserted snapshot into ClickHouse: ${totalCount} tunnels`);
    } catch (error) {
      console.error("Failed to insert into ClickHouse", error);
    }
  } finally {
    isSampling = false;
  }
}

async function start() {
  await connectRedis();
  await connectClickHouse();

  // Initial run
  await sampleActiveTunnels();

  setInterval(sampleActiveTunnels, 60_000);
}

start();
