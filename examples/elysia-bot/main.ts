import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { Elysia } from "elysia";
import node from "@elysiajs/node";
import { createServer as createNetServer } from "node:net";
import { pathToFileURL } from "node:url";
import { createBotDashboard } from "./dashboard";
import { loadBotConfig } from "../express-bot/config";
import { loadCommands, loadEvents } from "../express-bot/loader";
import { createDemoStateStore } from "../express-bot/state-store";
import type { BotRuntimeContext } from "../express-bot/types";

async function isPortFree(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const probe = createNetServer();
    probe.once("error", () => {
      resolve(false);
    });
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, host);
  });
}

async function listenWithFallback(app: Elysia, host: string, preferredPort: number): Promise<number> {
  const maxAttempts = 10;

  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const port = preferredPort + offset;
    const free = await isPortFree(host, port);
    if (!free) {
      continue;
    }

    try {
      await app.listen({
        port,
        hostname: host,
      });

      return app.server?.port ?? port;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const message = error instanceof Error ? error.message : "";
      const addressInUse = code === "EADDRINUSE" || message.includes("EADDRINUSE") || message.includes("address already in use");

      if (!addressInUse || offset === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("No available port found for dashboard server");
}

export async function bootstrapElysiaBotExample(): Promise<void> {
  const config = loadBotConfig();
  const app = new Elysia({ adapter: node() });

  const store = createDemoStateStore(new URL("../dashboard-demo-state.json", import.meta.url));
  await store.init();

  const commands = await loadCommands(new URL("../express-bot/commands/", import.meta.url));
  const events = await loadEvents(new URL("../express-bot/events/", import.meta.url));

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const context: BotRuntimeContext = {
    client,
    commands,
    store,
    config,
    startedAt: Date.now(),
  };

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => {
        void Promise.resolve(event.execute(context, ...args as never));
      });
      continue;
    }

    client.on(event.name, (...args) => {
      void Promise.resolve(event.execute(context, ...args as never));
    });
  }

  createBotDashboard({
    app,
    config,
    store,
    client,
    commandCount: commands.size,
  });

  const port = await listenWithFallback(app, "0.0.0.0", config.appPort);

  await client.login(config.botToken);

  console.log(`Dashboard ready at http://localhost:${port}${config.dashboardBasePath}`);
  console.log(`Live JSON state file: ${store.filePath}`);
}

const invokedDirectly = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (invokedDirectly) {
  bootstrapElysiaBotExample().catch((error) => {
    console.error("Failed to start Elysia bot example:", error);
    process.exit(1);
  });
}
