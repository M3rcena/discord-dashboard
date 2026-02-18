import "dotenv/config";
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import { createBotDashboard } from "./dashboard";
import { loadBotConfig } from "./config";
import { loadCommands, loadEvents } from "./loader";
import { createDemoStateStore } from "./state-store";
import type { BotRuntimeContext } from "./types";

async function listenWithFallback(app: express.Express, host: string, preferredPort: number): Promise<{ server: Server; port: number }> {
  const maxAttempts = 10;

  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const port = preferredPort + offset;

    try {
      const server = await new Promise<Server>((resolve, reject) => {
        const activeServer = app.listen(port, host, () => resolve(activeServer));
        activeServer.on("error", (error) => reject(error));
      });

      return { server, port };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || offset === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("No available port found for dashboard server");
}

export async function bootstrapRealBotExample(): Promise<void> {
  const config = loadBotConfig();
  const app = express();

  const store = createDemoStateStore(new URL("../dashboard-demo-state.json", import.meta.url));
  await store.init();

  const commands = await loadCommands(new URL("./commands/", import.meta.url));
  const events = await loadEvents(new URL("./events/", import.meta.url));

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const context: BotRuntimeContext = {
    client,
    commands,
    store,
    config,
    startedAt: Date.now()
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
    commandCount: commands.size
  });

  const { port } = await listenWithFallback(app, "0.0.0.0", config.appPort);

  await client.login(config.botToken);

  console.log(`Dashboard ready at http://localhost:${port}${config.dashboardBasePath}`);
  console.log(`Live JSON state file: ${store.filePath}`);
}

const invokedDirectly = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (invokedDirectly) {
  bootstrapRealBotExample().catch((error) => {
    console.error("Failed to start real bot example:", error);
    process.exit(1);
  });
}
