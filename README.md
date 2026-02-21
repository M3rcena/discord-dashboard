# @developer.krd/discord-dashboard

An advanced, plug-and-play Discord dashboard package for bot developers.

Build a full web dashboard for your bot without writing frontend code. The package provides built-in rendering, Discord OAuth2 flow, and adapters for Express, Elysia, and Fastify.

## ✨ Features

- **No frontend app required:** Server-rendered dashboard UI with built-in client script.
- **Multiple adapters:** `createExpressAdapter`, `createElysiaAdapter`, `createFastifyAdapter`.
- **Discord OAuth2 flow:** Login, callback exchange, and session persistence.
- **Theming and layouts:** Built-in layouts/themes (`default`, `compact`, `shadcn-magic`) plus custom renderers.
- **Home & plugin builders:** Dynamic sections/panels with typed action handlers.
- **Discord helper API:** Role/channel/member fetch & search helpers inside action context.
- **TypeScript-first:** Strict typed options, context, fields, and plugin contracts.

---

## 🎨 Templates

Browse built-in templates and screenshot placeholders in [src/templates/templates.md](src/templates/templates.md).

---

## 📦 Installation

```bash
npm install @developer.krd/discord-dashboard discord.js
```

Install only the server stack you use:

```bash
# Express
npm install express express-session

# Elysia
npm install elysia

# Fastify
npm install fastify @fastify/cookie @fastify/session
```

Node.js `>=18` is required.

---

## 🚀 Quick Start (Express)

```ts
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import { createExpressAdapter } from "@developer.krd/discord-dashboard";

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

createExpressAdapter({
  app,
  client,
  basePath: "/dashboard",
  dashboardName: "My Bot Control",

  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,

  uiTemplate: "shadcn-magic",
  uiTheme: "shadcn-magic",

  getOverviewCards: async (context) => [
    {
      id: "uptime",
      title: "Bot Uptime",
      value: `${Math.floor(process.uptime() / 60)} min`,
      subtitle: `Logged in as ${context.user.username}`,
    },
    {
      id: "guilds",
      title: "Manageable Guilds",
      value: context.guilds.length,
    },
  ],

  home: {
    async getSections(context) {
      return [
        {
          id: "welcome",
          title: "Welcome Settings",
          categoryId: "general",
          description: context.selectedGuildId ? "Guild-specific setup" : "User-level setup",
          fields: [
            { id: "enabled", label: "Enable Welcome", type: "boolean", value: true },
            { id: "message", label: "Message", type: "textarea", value: "Welcome to the server!" },
          ],
          actions: [{ id: "saveWelcome", label: "Save", variant: "primary" }],
        },
      ];
    },
    actions: {
      async saveWelcome(context, payload) {
        console.log("Saving data for", context.selectedGuildId, payload.values);
        return { ok: true, message: "Welcome settings saved", refresh: false };
      },
    },
  },
});

await client.login(process.env.DISCORD_BOT_TOKEN!);
app.listen(3000, () => {
  console.log("Dashboard live at: http://localhost:3000/dashboard");
});
```

## 🚀 Quick Start (Elysia)

```ts
import { Elysia } from "elysia";
import { Client, GatewayIntentBits } from "discord.js";
import { createElysiaAdapter } from "@developer.krd/discord-dashboard";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = new Elysia();

createElysiaAdapter({
  app,
  client,
  basePath: "/dashboard",
  dashboardName: "My Bot Control",

  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,

  uiTemplate: "shadcn-magic",
  uiTheme: "shadcn-magic",
});

await client.login(process.env.DISCORD_BOT_TOKEN!);
app.listen({ port: 3000 });
console.log("Dashboard live at: http://localhost:3000/dashboard");
```

## 🚀 Quick Start (Fastify)

```ts
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import { Client, GatewayIntentBits } from "discord.js";
import { createFastifyAdapter } from "@developer.krd/discord-dashboard";

const fastify = Fastify({ logger: true });
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

await fastify.register(fastifyCookie);
await fastify.register(fastifySession, {
  secret: process.env.DASHBOARD_SESSION_SECRET!,
  cookie: { secure: false },
});

createFastifyAdapter(fastify, {
  client,
  basePath: "/dashboard",
  dashboardName: "My Bot Control",

  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,

  uiTemplate: "shadcn-magic",
  uiTheme: "shadcn-magic",
});

await client.login(process.env.DISCORD_BOT_TOKEN!);
await fastify.listen({ port: 3000, host: "0.0.0.0" });
console.log("Dashboard live at: http://localhost:3000/dashboard");
```

---

## 🔌 Adapter Notes

- **Express:** `createExpressAdapter(options)`
- **Elysia:** `createElysiaAdapter(options)`
- **Fastify:** `createFastifyAdapter(fastify, options)`

For Fastify, you must register `@fastify/cookie` and `@fastify/session` before wiring the adapter, since dashboard routes read/write `request.session`.

---

## 🛠️ Extensible Plugins

```ts
createExpressAdapter({
  // ... core config ...
  plugins: [
    {
      id: "runtime",
      name: "System Runtime",
      description: "Live bot diagnostics",
      getPanels: async () => [
        {
          id: "runtime-status",
          title: "Diagnostics",
          fields: [
            { label: "Logged in as", value: client.user?.tag ?? "Unknown" },
            { label: "Uptime", value: `${Math.floor(process.uptime())}s` },
          ],
          actions: [{ id: "refreshRuntime", label: "Refresh", variant: "primary", collectFields: false }],
        },
      ],
      actions: {
        refreshRuntime: async () => ({ ok: true, message: "Data refreshed", refresh: true }),
      },
    },
  ],
});
```

---

## 🧩 Built-in Helper Functions

Inside `home.actions` and `plugins.actions`, use `context.helpers`:

- `getGuildIconUrl(guildId, iconHash)`
- `getUserAvatarUrl(userId, avatarHash)`
- `getChannel(channelId)`
- `getGuildChannels(guildId)`
- `searchGuildChannels(guildId, query, options?)`
- `getRole(guildId, roleId)`
- `getGuildRoles(guildId)`
- `searchGuildRoles(guildId, query, options?)`
- `searchGuildMembers(guildId, query, options?)`
- `getGuildMember(guildId, userId)`

---

## 🔍 Lookup Fields

Field types include `role-search`, `channel-search`, and `member-search`, and you can provide lookup options in field config (for limits and filters).

```ts
{
  id: "logChannel",
  label: "Logs",
  type: "channel-search",
  lookup: {
    limit: 5,
    channelTypes: [0, 5],
  },
}
```

---

## 📚 API Reference

`DashboardOptions` includes:

- OAuth/session config (`clientId`, `clientSecret`, `redirectUri`, `sessionSecret`, ...)
- Dashboard presentation (`dashboardName`, `basePath`, `uiTemplate`, `uiTheme`, `setupDesign`)
- Dynamic content (`getOverviewCards`, `home`, `plugins`)
- Runtime dependencies (`client`, optional framework app where supported)

Also exported:

- `DashboardEngine`
- `DashboardDesigner`

---

## 🔒 Required Discord OAuth2 Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Open your Application → **OAuth2**.
3. Add your redirect URI (example: `http://localhost:3000/dashboard/callback`).
4. Use your `CLIENT_ID` and `CLIENT_SECRET` in dashboard config.

Use a strong `sessionSecret` in production and serve behind HTTPS.

---

## 📄 License

MIT
