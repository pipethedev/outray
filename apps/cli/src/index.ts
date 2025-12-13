#!/usr/bin/env node

import chalk from "chalk";
import { OutRayClient } from "./client";

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.red("❌ Please specify a local port"));
    console.log(chalk.cyan("Usage: outray <port>"));
    console.log(chalk.cyan("Example: outray 3000"));
    process.exit(1);
  }

  const localPort = parseInt(args[0], 10);

  if (isNaN(localPort) || localPort < 1 || localPort > 65535) {
    console.log(chalk.red("❌ Invalid port number"));
    console.log(chalk.cyan("Port must be between 1 and 65535"));
    process.exit(1);
  }

  let subdomain: string | undefined;
  const subdomainIndex = args.indexOf("--subdomain");
  if (subdomainIndex !== -1 && args[subdomainIndex + 1]) {
    subdomain = args[subdomainIndex + 1];
  }

  const serverUrl = process.env.OUTRAY_SERVER_URL || "wss://api.outray.dev/";

  let apiKey = process.env.OUTRAY_API_KEY;
  const keyIndex = args.indexOf("--key");
  if (keyIndex !== -1 && args[keyIndex + 1]) {
    apiKey = args[keyIndex + 1];
  }

  const client = new OutRayClient(localPort, serverUrl, apiKey, subdomain);
  client.start();

  process.on("SIGINT", () => {
    console.log(chalk.cyan("\n👋 Shutting down gracefully..."));
    client.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log(chalk.cyan("\n👋 Shutting down gracefully..."));
    client.stop();
    process.exit(0);
  });
}

main();
