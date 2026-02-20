# @developer.krd/discord-dashboard

An advanced, plug-and-play Discord dashboard package for bot developers.

Build a fully functional, beautiful web dashboard for your bot without writing a single line of frontend code. Powered by Express, this package handles the OAuth2 login flow, session management, UI rendering, and API routing out of the box.

## ✨ Features

- **No Frontend Coding:** Generates a beautiful React/Vue-like UI using pure server-side rendering.
- **Built-in Auth:** Complete Discord OAuth2 login flow with secure session management.
- **Guild Access Control:** Automatically filters guilds based on admin/manage server permissions.
- **Fluent Designer API:** Build your dashboard cleanly using a chainable builder pattern.
- **Custom CSS Injection:** Fully theme the dashboard to match your bot's branding.
- **Extensible Plugins:** Create separate plugin panels with actionable buttons and forms.
- **Rich Form Fields:** Support for text, selects, booleans, and drag-and-drop string lists.
- **Smart Discord Lookups:** Website autocomplete fields for finding Roles, Channels, and Members.
- **Discord-like UI:** Familiar server rail with avatars and invite-on-click for missing guilds.

---

## 🎨 Templates

Browse built-in templates and screenshot placeholders in [src/templates/templates.md](src/templates/templates.md).

---

## 📦 Installation

```bash
npm install @developer.krd/discord-dashboard
```

_(This package supports TypeScript, JavaScript, and ESM out of the box. Node.js >= 18 is required)._

---

## 🚀 Quick Start (Direct Configuration)

The fastest way to get your dashboard running is by instantiating the `DiscordDashboard` class directly.

```ts
import express from "express";
import { DiscordDashboard } from "@developer.krd/discord-dashboard";

const app = express();

const dashboard = new DiscordDashboard({
  app, // Attach to your existing Express app
  basePath: "/dashboard",
  dashboardName: "My Bot Control",
  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,
  ownerIds: ["YOUR_DISCORD_USER_ID"],

  getOverviewCards: async (context) => [
    {
      id: "uptime",
      title: "Bot Uptime",
      value: `${Math.floor(process.uptime() / 60)} min`,
      subtitle: `Logged in as ${context.user.username}`,
      intent: "success",
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

// Start your Express server normally
app.listen(3000, () => {
  console.log("Dashboard live at: http://localhost:3000/dashboard");
});
```

---

## 🎨 Fluent Dashboard Designer (Recommended)

For larger bots, putting all your configuration in one object gets messy. Use the `DashboardDesigner` class to build your dashboard modularly.

This approach also allows you to easily inject **Custom CSS** and define dashboard colors.

```ts
import express from "express";
import { DashboardDesigner } from "@developer.krd/discord-dashboard";

const app = express();

const dashboard = new DashboardDesigner({
  app,
  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,
})
  .setup({
    ownerIds: ["1234567890"],
    botInvitePermissions: "8",
  })
  // Customize the default color palette
  .setupDesign({
    primary: "#4f46e5",
    rail: "#181a20",
    panel: "#2f3136",
  })
  // Inject your own CSS rules
  .customCss(
    `
    .brand { font-size: 1.2rem; text-transform: uppercase; }
    button.primary { box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }
  `,
  )
  // Build a Guild-specific settings category
  .guildCategory("pets", "Pets", (category) => {
    category.section({
      id: "pets-guild",
      title: "Guild Pets",
      fields: [{ id: "petsChannelId", label: "Pets Channel", type: "channel-search" }],
      actions: [{ id: "saveGuildPets", label: "Save", variant: "primary" }],
    });
  })
  // Handle the save action
  .onHomeAction("saveGuildPets", async (context, payload) => {
    const channelId = String(payload.values.petsChannelId ?? "");
    const channel = await context.helpers.getChannel(channelId);
    if (!channel) return { ok: false, message: "Channel not found" };
    return { ok: true, message: "Saved successfully!", refresh: true };
  })
  // Automatically instantiates the DiscordDashboard class
  .createDashboard();

app.listen(3000, () => console.log("Dashboard ready!"));
```

---

## 🧩 Built-in Helper Functions

Whenever you handle an action (`onHomeAction` or inside a Plugin), you get access to the `context.helpers` object. These automatically use the bot token to fetch data from the Discord API.

- `getChannel(channelId)`
- `getGuildChannels(guildId)`
- `getRole(guildId, roleId)`
- `getGuildRoles(guildId)`
- `getGuildMember(guildId, userId)`
- `searchGuildRoles(guildId, query, options)`
- `searchGuildChannels(guildId, query, options)`

---

## 🛠️ Plugin Scopes & Forms

Plugins are modular features you can attach to the dashboard. They can be restricted to specific scopes.

- `scope: "user"` → Shows only on the User Dashboard (when no server is selected).
- `scope: "guild"` → Shows only on the Guild Dashboard.
- `scope: "both"` → (Default) Shows everywhere.

### Example: Ticket Panel Builder Plugin

```ts
import { DiscordDashboard } from "@developer.krd/discord-dashboard";

const dashboard = new DiscordDashboard({
  // ... core credentials ...
  plugins: [
    {
      id: "tickets",
      name: "Tickets",
      scope: "guild",
      getPanels: async () => [
        {
          id: "ticket-panel",
          title: "Ticket Panel Generator",
          fields: [
            { id: "targetChannel", label: "Target Channel", type: "channel-search", editable: true },
            { id: "title", label: "Embed Title", type: "text", editable: true, value: "Need help?" },
            { id: "description", label: "Embed Description", type: "textarea", editable: true },
            { id: "buttonLabel", label: "Button Label", type: "text", editable: true, value: "Open Ticket" },
          ],
          actions: [{ id: "publishTicket", label: "Publish to Channel", variant: "primary", collectFields: true }],
        },
      ],
      actions: {
        publishTicket: async (context, body) => {
          // body.values contains the form data because collectFields was true
          const data = body as { values?: Record<string, unknown> };
          const values = data.values ?? {};

          console.log(`Creating ticket panel in ${values.targetChannel}`);
          return { ok: true, message: `Ticket panel published!`, data: values };
        },
      },
    },
  ],
});
```

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

### `DashboardDesigner` Methods

- **`setup(options)`**: Set core info (`ownerIds`, `dashboardName`, `basePath`, `uiTemplate`).
- **`setupDesign(config)`**: Override theme colors (e.g., `primary`, `bg`, `panel`).
- **`customCss(cssString)`**: Inject raw CSS to completely customize the dashboard.
- **`setupCategory(id, label, build)`**: Add tabs to the one-time setup view.
- **`userCategory(id, label, build)`**: Add tabs to the user dashboard.
- **`guildCategory(id, label, build)`**: Add tabs to the server dashboard.
- **`onHomeAction(actionId, handler)`**: Define what happens when a button is clicked.
- **`createDashboard()`**: Terminal method. Builds the config and returns a `DiscordDashboard` instance.

### `DiscordDashboard` Methods

- **`app`**: The Express instance (either the one you provided, or a newly created one).
- **`start()`**: Starts the internal HTTP server (only if you didn't pass your own Express app).
- **`stop()`**: Gracefully shuts down the internal server.

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
