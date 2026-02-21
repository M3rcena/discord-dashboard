import type { Client } from "discord.js";
import { Elysia } from "elysia";
import { createElysiaAdapter } from "../../src";
import type { BotConfig } from "../express-bot/types";
import type { DemoStateStore } from "../express-bot/state-store";

export function createBotDashboard(options: {
  app: Elysia;
  config: BotConfig;
  store: DemoStateStore;
  client: Client;
  commandCount: number;
}) {
  const { app, config, store, client, commandCount } = options;

  return createElysiaAdapter({
    app,
    basePath: config.dashboardBasePath,
    dashboardName: `${config.dashboardName} (Elysia)`,
    uiTemplate: "default",
    uiTheme: "default",
    botToken: config.botToken,
    client,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    sessionSecret: config.sessionSecret,
    ownerIds: config.ownerIds,
    botInvitePermissions: "8",
    botInviteScopes: ["bot", "applications.commands"],

    getOverviewCards: async (context) => {
      const state = await store.read();
      return [
        {
          id: "who",
          title: "Authenticated As",
          value: context.user.global_name || context.user.username,
          subtitle: context.user.id,
        },
        {
          id: "commands",
          title: "Slash Commands",
          value: String(commandCount),
          subtitle: config.devGuildId ? "Guild scoped registration" : "Global registration",
        },
        {
          id: "guilds",
          title: "Tracked Guilds",
          value: String(Object.keys(state.guilds).length),
          subtitle: "Persisted in JSON",
        },
      ];
    },

    home: {
      getCategories: async (context) => {
        if (context.selectedGuildId) {
          return [
            { id: "overview", label: "Overview", scope: "guild" },
            { id: "setup", label: "Setup", scope: "setup" },
          ];
        }

        return [
          { id: "overview", label: "Overview", scope: "user" },
          { id: "setup", label: "Setup", scope: "setup" },
        ];
      },
      getSections: async (context) => {
        const state = await store.read();

        return [
          {
            id: "runtime",
            title: "Runtime",
            categoryId: "overview",
            scope: context.selectedGuildId ? "guild" : "user",
            width: 50,
            fields: [
              { id: "bot", label: "Bot User", type: "text", value: client.user?.tag ?? "Not logged in", readOnly: true },
              { id: "uptime", label: "Node Uptime", type: "text", value: `${Math.floor(process.uptime())}s`, readOnly: true },
              { id: "rss", label: "Memory RSS", type: "text", value: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`, readOnly: true },
            ],
          },
          {
            id: "state",
            title: "State File",
            categoryId: "setup",
            scope: "setup",
            width: 50,
            fields: [
              { id: "file", label: "Path", type: "text", value: store.filePath, readOnly: true },
              { id: "lastAction", label: "Last Action", type: "text", value: state.meta.lastAction, readOnly: true },
              { id: "saveCount", label: "Save Count", type: "number", value: state.meta.saveCount, readOnly: true },
            ],
          },
        ];
      },
    },
  });
}
