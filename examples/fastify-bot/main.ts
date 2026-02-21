import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import type { FastifyInstance } from "fastify";
import { pathToFileURL } from "node:url";
import { createBotDashboard } from "./dashboard";
import { loadBotConfig } from "../express-bot/config";
import { loadCommands, loadEvents } from "../express-bot/loader";
import { createDemoStateStore } from "../express-bot/state-store";
import type { BotRuntimeContext } from "../express-bot/types";

async function listenWithFallback(app: FastifyInstance, host: string, preferredPort: number): Promise<number> {
  const maxAttempts = 10;

  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const port = preferredPort + offset;

    try {
      await app.listen({ port, host });
      const address = app.server.address();

      if (address && typeof address === "object") {
        return address.port;
      }

      return port;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || offset === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("No available port found for dashboard server");
}

export async function bootstrapFastifyBotExample(): Promise<void> {
  const config = loadBotConfig();
  const fastify = Fastify();

  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    secret: config.sessionSecret,
    cookie: { secure: false },
  });

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
    fastify,
    config,
    store,
    client,
    commandCount: commands.size,
  });

  const port = await listenWithFallback(fastify, "0.0.0.0", config.appPort);

  await client.login(config.botToken);

  console.log(`Dashboard ready at http://localhost:${port}${config.dashboardBasePath}`);
  console.log(`Live JSON state file: ${store.filePath}`);
}

const invokedDirectly = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (invokedDirectly) {
  bootstrapFastifyBotExample().catch((error) => {
    console.error("Failed to start Fastify bot example:", error);
    process.exit(1);
  });
}
