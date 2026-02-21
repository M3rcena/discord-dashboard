# @developer.krd/discord-dashboard

An advanced, plug-and-play Discord dashboard package for bot developers.

Build a fully functional, beautiful web dashboard for your bot without writing a single line of frontend code. Now framework agnostic, this package includes adapters for Express (with Fastify and Elysia support coming), handling the OAuth2 login flow, session management, UI rendering, and API routing out of the box.

## ✨ Features

- **No Frontend Coding:** Generates a beautiful React/Vue-like UI using pure server-side rendering and vanilla JS.
- **Framework Adapters:** Easily plug into your existing Express server using createExpressAdapter.
- **Built-in Auth:** Complete Discord OAuth2 login flow with secure session management.
- **Guild Access Control:** Automatically filters guilds based on `Administrator` or `Manage Server` permissions.
- **Live Bot Status:** Uses your active Discord.js `Client` to detect if the bot is in a server and dynamically shows "Dashboard" vs "Invite Bot" buttons.
- **Extensible Plugins:** Create dynamic, runtime-evaluated plugin panels with actionable buttons and forms.
- **Rich Form Fields:** Support for text, selects, booleans, and drag-and-drop string lists.
- **Smart Discord Lookups:** Website autocomplete fields for finding Roles, Channels, and Members.
- **Theming & Templates:** Strict TypeScript autocomplete for built-in themes (`default`, `compact`, `shadcn-magic`) and custom CSS injection.

---

## 🎨 Templates

Browse built-in templates and screenshot placeholders in [src/templates/templates.md](src/templates/templates.md).

---

## 📦 Installation

```bash
npm install @developer.krd/discord-dashboard
npm install discord.js express express-session # Peer dependencies
```

_(This package supports TypeScript, JavaScript, and ESM out of the box. Node.js >= 18 is required)._

---

## 🚀 Quick Start (Direct Configuration)

The fastest way to get your dashboard running is by passing your configurations and Discord.js Client directly into the `createExpressAdapter`.

```ts
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import { createExpressAdapter } from "@developer.krd/discord-dashboard";

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const dashboard = createExpressAdapter({
  app, // Attach to your existing Express app
  client, // Required: Injects your DJS client for live cache checking
  basePath: "/dashboard",
  dashboardName: "My Bot Control",

  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,
  ownerIds: ["YOUR_DISCORD_USER_ID"],

  // Strict typings for built-in beautiful layouts
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
          description: context.selectedGuildId ? "Guild-specific setup" : "User-level setup",
          fields: [
            { id: "enabled", label: "Enable Welcome", type: "boolean", value: true },
            { id: "channel", label: "Channel", type: "channel-search" },
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

// Login your bot and start your Express server
client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
  app.listen(3000, () => {
    console.log("Dashboard live at: http://localhost:3000/dashboard");
  });
});
```

---

## 🛠️ Extensible Plugins

Plugins are modular features you can attach to the dashboard. They utilize a dynamic `getPanels` function so you can render data specific to the logged-in user or selected guild!

**Example: Runtime & Diagnostics Plugin**

```ts
import { createExpressAdapter } from "@developer.krd/discord-dashboard";

createExpressAdapter({
  // ... core credentials and client ...
  plugins: [
    {
      id: "runtime",
      name: "System Runtime",
      description: "Live bot diagnostics",
      // Dynamically generate panels based on context
      getPanels: async (context) => [
        {
          id: "runtime-status",
          title: "Diagnostics",
          fields: [
            { id: "user", label: "Logged in as", type: "text", value: client.user?.tag, readOnly: true },
            { id: "uptime", label: "Uptime", type: "text", value: `${Math.floor(process.uptime())}s`, readOnly: true },
          ],
          // Tells the UI to render a button
          actions: [{ id: "refreshRuntime", label: "Refresh", variant: "primary", collectFields: false }],
        },
      ],
      // Tells the backend how to handle the button click
      actions: {
        refreshRuntime: async (context, body) => {
          // Returning refresh: true tells the frontend to re-fetch getPanels and update the UI!
          return { ok: true, message: "Data refreshed!", refresh: true };
        },
      },
    },
  ],
});
```

---

## 🧩 Built-in Helper Functions

Whenever you handle an action (in `home.actions` or `plugin.actions`), you get access to the `context.helpers` object. These automatically use the user's access token or bot token to fetch data from the Discord API safely.

- `getGuildIconUrl(guildId, iconHash)`
- `getUserAvatarUrl(userId, avatarHash)`
- `getChannel(channelId)`
- `getGuildChannels(guildId)`
- `getRole(guildId, roleId)`
- `getGuildRoles(guildId)`
- `getGuildMember(guildId, userId)`

---

## 🔍 Lookup Fields (Discord Entities)

Instead of forcing users to copy/paste IDs, use lookup fields to provide a rich website autocomplete experience.

- `type: "role-search"`: Type a role name, select it, and the action receives the full Role object.
- `type: "channel-search"`: Type a channel name.
- `type: "member-search"`: Type a username or nickname.

You can configure lookups with filters:

```ts
{
  id: "logChannel",
  label: "Logs",
  type: "channel-search",
  lookup: {
    limit: 5,
    channelTypes: [0, 5] // 0 = GUILD_TEXT, 5 = GUILD_ANNOUNCEMENT
  }
}
```

---

## 📚 API Reference

### `DashboardOptions` Interface

Passed into `createExpressAdapter(options)`.

- `app`: Your Express/Fastify/Elysia instance.
- `client`: **(Required)** Your logged-in `discord.js` Client.
- `basePath`: The mount URL for the dashboard (e.g., `/dashboard`).
- `uiTemplate` / `uiTheme`: Built-in visual layouts (`"default"`, `"compact"`, `"shadcn-magic"`).
- `setupDesign`: Object to override specific CSS variable hex codes (e.g., `{ primary: "#ff0000" }`).
- `home`: Object containing `getSections()` and actions for the main dashboard view.
- `plugins`: Array of `DashboardPlugin` objects for modular extensions.

---

## 🔒 Required Discord OAuth2 Setup

To make login work:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Open your Application -> **OAuth2**.
3. Add your Redirect URI (e.g., `http://localhost:3000/dashboard/callback`).
4. Grab your `CLIENT_ID` and `CLIENT_SECRET` to use in your dashboard config.

_Note: Ensure your `sessionSecret` is a long, random string in production, and run your bot behind HTTPS._

---

## 📄 License

MIT
