import { createClient } from "@clickhouse/client";
import { config } from "../config";

export const clickhouse = createClient({
  url: config.clickhouse.host,
  username: config.clickhouse.username,
  password: config.clickhouse.password,
  database: config.clickhouse.database,
});
