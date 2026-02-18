# @developer.krd/discord-dashboard

Advanced plug-and-play Discord dashboard package for bot developers.

- No frontend coding required.
- Built-in Discord OAuth2 login flow.
- Ready-made dashboard UI.
- Guild access control.
- Discord-like server rail with user/guild avatars.
- Invite-on-click flow for guilds where bot is not installed.
- Extensible plugin panels + server actions.
- Flexible Home Builder with editable sections and save actions.
- Fluent designer API for setup/user/guild dashboard separation.
- Fluent `.setupDesign(...)` API for dashboard main colors.
- Home section width presets: `100` (default), `50`, `33`, `20`.
- Built-in Discord utility helpers in actions (`getChannel`, `getRole`, `getGuildRoles`, etc.).
- Overview-first tabs with separate module categories (like pets, permissions, etc.).
- Website autocomplete field types for role/channel selection with filtering.

## Install

```bash
npm install @developer.krd/discord-dashboard
```

## Ways to Create a Dashboard

You can build your dashboard in multiple styles depending on your project:

1. **Direct Config (`createDashboard`)**
  - Fastest way for simple dashboards.
  - Use `home`, `plugins`, and `getOverviewCards` directly.

2. **Fluent Designer (`createDashboardDesigner`)**
  - Best for larger bots and modular structure.
  - Use `setupCategory`, `userCategory`, `guildCategory`, and `onHomeAction`.

3. **Discord-like Lifecycle Pages**
  - Use `setupPage + onLoad/onSave` (also `onload/onsave`).
  - Great when pages need dynamic loading and per-page save handlers.

4. **Template-based UI/UX**
  - Choose built-in template (`default`, `compact`) with `uiTemplate`.
  - Register custom full HTML templates with `uiTemplates` or Designer `addTemplate`.

## Language Support

This package supports TypeScript, JavaScript (`.js`), and ESM JavaScript (`.mjs`).

TypeScript / ESM:

```ts
import { createDashboard } from "@developer.krd/discord-dashboard";
```

JavaScript ESM (`.mjs`):

```js
import { createDashboard } from "@developer.krd/discord-dashboard";
```

JavaScript CommonJS (`.js` with `require`):

```js
const { createDashboard } = require("@developer.krd/discord-dashboard");
```

## Quick Start

```ts
import express from "express";
import { createDashboard } from "@developer.krd/discord-dashboard";

const app = express();

const dashboard = createDashboard({
  app,
  basePath: "/dashboard",
  dashboardName: "KRD Bot Control",
  botToken: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/dashboard/callback",
  sessionSecret: process.env.DASHBOARD_SESSION_SECRET!,
  ownerIds: ["123456789012345678"],
  getOverviewCards: async (context) => [
    {
      id: "uptime",
      title: "Bot Uptime",
      value: `${Math.floor(process.uptime() / 60)} min`,
      subtitle: `Logged in as ${context.user.username}`
    },
    {
      id: "guilds",
      title: "Guilds",
      value: context.guilds.length
    }
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
            { id: "channel", label: "Channel ID", type: "text", value: "" },
            { id: "message", label: "Message", type: "textarea", value: "Welcome to the server!" }
          ],
          actions: [{ id: "saveWelcome", label: "Save", variant: "primary" }]
        }
      ];
    },
    actions: {
      async saveWelcome(context, payload) {
        console.log("Saving", context.selectedGuildId, payload.values);
        return { ok: true, message: "Welcome settings saved", refresh: false };
      }
    }
  },
  plugins: [
    {
      id: "moderation",
      name: "Moderation",
      description: "Live moderation controls",
      async getPanels(context) {
        return [
          {
            id: "status",
            title: "Status",
            fields: [
              { label: "Selected Guild", value: context.selectedGuildId ?? "None" },
              { label: "Access", value: "Ready" }
            ],
            actions: [
              { id: "sync", label: "Sync Rules", variant: "primary" }
            ]
          }
        ];
      },
      actions: {
        async sync() {
          return { ok: true, message: "Moderation rules synced.", refresh: true };
        }
      }
    }
  ]
});

app.listen(3000, () => {
  console.log("Dashboard: http://localhost:3000/dashboard");
});
```

## Fluent Dashboard Designer (Recommended)

Use a clean modular structure instead of putting all configuration in one place:

- `setup(...)` for important defaults
- `setupDesign(...)` for dashboard colors (`primary`, `bg`, `rail`, `panel`, etc.)
- `setupCategory(...)` for one-time setup UI
- `userCategory(...)` for user dashboard sections
- `guildCategory(...)` for server dashboard sections
- `onHomeAction(...)` for save handlers

```ts
import { createDashboard, createDashboardDesigner } from "@developer.krd/discord-dashboard";

const designer = createDashboardDesigner({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret
})
  .setup({ ownerIds: ["123"], botInvitePermissions: "8" })
  .setupDesign({ primary: "#4f46e5", rail: "#181a20", panel: "#2f3136" })
  .userCategory("pets", "Pets", (category) => {
    category.section({
      id: "pets-user",
      title: "User Pets",
      width: 50,
      fields: [{ id: "petName", label: "Pet Name", type: "text", value: "Luna" }],
      actions: [{ id: "saveUserPets", label: "Save", variant: "primary" }]
    });
  })
  .guildCategory("pets", "Pets", (category) => {
    category.section({
      id: "pets-guild",
      title: "Guild Pets",
      fields: [{ id: "petsChannelId", label: "Pets Channel", type: "text", value: "" }],
      actions: [{ id: "saveGuildPets", label: "Save", variant: "primary" }]
    });
  })
  .onHomeAction("saveGuildPets", async (context, payload) => {
    const channelId = String(payload.values.petsChannelId ?? "");
    const channel = await context.helpers.getChannel(channelId);
    if (!channel) return { ok: false, message: "Channel not found" };
    return { ok: true, message: "Saved", refresh: true };
  });

createDashboard({ ...designer.build() });
```

## Discord-Style Flexible Flow (`onLoad` / `onSave`)

You can also build pages in a Discord-client-like style:

```ts
import { createDashboard, createDashboardDesigner } from "@developer.krd/discord-dashboard";

const dashboard = createDashboardDesigner({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret
})
  .setupPage({
    id: "profile",
    title: "Profile",
    scope: "user",
    width: 50,
    fields: [
      { id: "bio", label: "Bio", type: "textarea", value: "" },
      { id: "notifications", label: "Notifications", type: "boolean", value: true }
    ]
  })
  .onLoad("profile", async (ctx, section) => ({
    ...section,
    description: `Loaded for ${ctx.user.username}`
  }))
  .onSave("profile", async (ctx, payload) => {
    console.log("save profile", ctx.user.id, payload.values);
    return { ok: true, message: "Profile saved", refresh: true };
  });

createDashboard({ ...dashboard.build() });
```

Notes:

- `setupPage(...)` creates a page/section with optional fields/actions.
- `onLoad(pageId, handler)` (or lowercase `onload`) runs when that page is resolved.
- `onSave(pageId, handler)` (or lowercase `onsave`) auto-adds a default **Save** action if missing.

## Designer API Reference

`createDashboardDesigner(baseOptions)` supports:

- `setup({...})`: core setup (`ownerIds`, invite permissions/scopes, name/path, `uiTemplate`).
- `setupDesign({...})`: color/theme tokens for built-in templates.
- `setupCategory(id, label, build)`
- `userCategory(id, label, build)`
- `guildCategory(id, label, build)`
- `onHomeAction(actionId, handler)`
- `setupPage({...})`: page-style section definition.
- `onLoad(pageId, handler)` + alias `onload(...)`.
- `onSave(pageId, handler)` + alias `onsave(...)`.
- `addTemplate(templateId, renderer)` + `useTemplate(templateId)`.
- `build()`: returns full `DashboardOptions` for `createDashboard(...)`.

## UI Template System (for package developers)

You can ship multiple UI/UX templates and choose one by id.

Built-in templates:

- `default`
- `compact`

Use built-in compact mode:

```ts
createDashboard({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret,
  uiTemplate: "compact"
});
```

Direct `createDashboard(...)` usage:

```ts
import { createDashboard } from "@developer.krd/discord-dashboard";

createDashboard({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret,
  uiTemplate: "glass",
  uiTemplates: {
    glass: ({ dashboardName, basePath }) => `
      <!doctype html>
      <html>
        <head><title>${dashboardName}</title></head>
        <body>
          <h1>${dashboardName}</h1>
          <p>Custom template active. Base path: ${basePath}</p>
        </body>
      </html>
    `
  }
});
```

Designer usage:

```ts
const designer = createDashboardDesigner({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret
})
  .addTemplate("glass", ({ dashboardName }) => `<html><body><h1>${dashboardName}</h1></body></html>`)
  .useTemplate("glass");

createDashboard({ ...designer.build() });
```

Template renderer signature:

- Input: `{ dashboardName, basePath, setupDesign }`
- Output: full HTML string (complete document/template, not only CSS overrides)

Template files in this package are organized under [src/templates](src/templates).

## Built-in Helper Functions

Available in `context.helpers` inside home/plugin actions:

- `getChannel(channelId)`
- `getGuildChannels(guildId)`
- `getRole(guildId, roleId)`
- `getGuildRoles(guildId)`
- `getGuildMember(guildId, userId)`

## Plugin Scopes and Form Actions

Plugins can now be separated by target dashboard scope:

- `scope: "user"` → shown only on user dashboard
- `scope: "guild"` → shown only on guild dashboard
- `scope: "both"` (default) → shown on both

Plugin action forms:

- Mark a panel field with `editable: true` and set `type` (text, textarea, select, boolean, role-search, channel-search, member-search, url).
- Use `type: "string-list"` for drag-and-drop ordered labels (great for poll buttons).
- Set action `collectFields: true` to send panel values in the action payload.
- Action body format:
  - `panelId`
  - `values` (contains selected lookup objects and typed field values)

## Lookup Field Types (Website UI)

Use these in home sections to let users type and select Discord objects:

- `role-search`: type role name, get matching roles, select one, submit role object data.
- `channel-search`: type channel name, get matching channels with filters, select one, submit channel object data.

Lookup filters:

- `limit`
- `minQueryLength`
- `includeManaged` (roles)
- `nsfw` (channels)
- `channelTypes` (channels)

## Required Discord OAuth2 Setup

1. Open the Discord Developer Portal for your application.
2. In OAuth2 settings, add your redirect URI (example: `http://localhost:3000/dashboard/callback`).
3. Make sure scopes include at least `identify guilds`.
4. Use your app `CLIENT_ID` and `CLIENT_SECRET` in `createDashboard()`.

## API Reference

### `createDashboard(options)`

Creates and mounts a complete dashboard with OAuth2 + UI.

Key `options`:

- `app?`: existing Express app instance.
- `basePath?`: dashboard route prefix. Default: `/dashboard`.
- `dashboardName?`: topbar/dashboard title.
- `setupDesign?`: override CSS theme variables (`primary`, `bg`, `rail`, `panel`, etc.).
- `uiTemplate?`: template id to render (`default`, `compact`, or your custom id).
- `uiTemplates?`: custom full-HTML template renderers.
- `botToken`: bot token (for your own plugin logic).
- `clientId`, `clientSecret`, `redirectUri`: Discord OAuth2 credentials.
- `sessionSecret`: secret for encrypted session cookies.
- `sessionName?`, `sessionMaxAgeMs?`: cookie/session configuration.
- `scopes?`: OAuth scopes for login (default includes `identify guilds`).
- `botInvitePermissions?`, `botInviteScopes?`: controls invite link generation.
- `ownerIds?`: optional allow-list of Discord user IDs.
- `guildFilter?`: async filter for guild visibility.
- `getOverviewCards?`: dynamic card resolver.
- `home?`: configurable homepage sections + save handlers.
- `home.getOverviewSections?`: add overview-scoped sections.
- `home.getCategories?`: define category tabs (setup/user/guild).
- `home.getSections?`: define sections for active scope.
- `home.actions?`: action handlers for section actions.
- `plugins?`: plugin definitions with panels/actions.
- `trustProxy?`: proxy configuration when running behind reverse proxies.
- `host?`, `port?`: only used when you call `dashboard.start()` without passing `app`.

Return value:

- `app`: Express app instance.
- `start()`: starts internal server only if you didn’t pass `app`.
- `stop()`: stops internal server.

## Security Notes

- Uses secure HTTP-only session cookies.
- Uses OAuth2 `state` validation for callback integrity.
- Use HTTPS in production and strong `sessionSecret`.
- Optionally set trusted proxy with `trustProxy`.

## Local Development

```bash
npm install
npm run typecheck
npm run build
```

Run the example app:

```bash
cp .env.example .env
# Fill .env with your Discord app credentials first
npm run example
```

Run the real-bot entry directly:

```bash
npm run real-bot
```

## Real Bot Code Examples

The real-bot sample is in:

- [examples/real-bot/main.ts](examples/real-bot/main.ts)
- [examples/real-bot/dashboard.ts](examples/real-bot/dashboard.ts)
- [examples/real-bot/commands](examples/real-bot/commands)
- [examples/real-bot/events](examples/real-bot/events)

### Slash command example (`/ping`)

```ts
import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check latency"),
  async execute(context, interaction) {
    const wsPing = context.client.ws.ping;
    const start = interaction.createdTimestamp;
    const response = await interaction.reply({ content: "Pinging...", fetchReply: true });
    const apiPing = response.createdTimestamp - start;
    await interaction.editReply(`🏓 Pong! WS: ${wsPing}ms | API: ${apiPing}ms`);
  }
};

export default command;
```

### Event example (`interactionCreate`)

```ts
import type { BotEvent } from "../types";

const event: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(context, interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = context.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "Command not found.", ephemeral: true });
      return;
    }

    await command.execute(context, interaction);
  }
};

export default event;
```

### Dashboard creation example (classic + flexible pages)

```ts
createDashboard({
  app,
  botToken,
  clientId,
  clientSecret,
  redirectUri,
  sessionSecret,
  uiTemplate: "compact",
  home: {
    async getSections(ctx) {
      return [{
        id: "classic",
        title: "Classic Home",
        scope: ctx.selectedGuildId ? "guild" : "user",
        fields: [{ id: "mode", label: "Mode", type: "text", value: ctx.selectedGuildId ? "Guild" : "User", readOnly: true }]
      }];
    }
  }
});

// Flexible style:
createDashboard({
  ...createDashboardDesigner({ app, botToken, clientId, clientSecret, redirectUri, sessionSecret })
    .setupPage({ id: "profile", title: "Profile", scope: "user", fields: [{ id: "bio", label: "Bio", type: "textarea" }] })
    .onLoad("profile", async (ctx, section) => ({ ...section, description: `Loaded for ${ctx.user.username}` }))
    .onSave("profile", async () => ({ ok: true, message: "Saved", refresh: true }))
    .build()
});
```

While using the real-bot example, live edits and bot activity are persisted to [examples/dashboard-demo-state.json](examples/dashboard-demo-state.json).

## Common Recipes

### Welcome System (Guild Home Section)

```ts
import { createDashboard, createDashboardDesigner } from "@developer.krd/discord-dashboard";

const designer = createDashboardDesigner({ app, botToken, clientId, clientSecret, redirectUri, sessionSecret })
  .guildCategory("welcome", "Welcome", (category) => {
    category.section({
      id: "welcome-settings",
      title: "Welcome Settings",
      fields: [
        { id: "enabled", label: "Enabled", type: "boolean", value: true },
        { id: "channel", label: "Welcome Channel", type: "channel-search", placeholder: "Search channel..." },
        { id: "message", label: "Message", type: "textarea", value: "Welcome to the server, {user}!" }
      ],
      actions: [{ id: "saveWelcome", label: "Save Welcome", variant: "primary" }]
    });
  })
  .onHomeAction("saveWelcome", async (context, payload) => {
    if (!context.selectedGuildId) return { ok: false, message: "Select a guild first" };
    const channel = payload.values.channel as { id?: string; name?: string } | null;
    return { ok: true, message: `Welcome config saved for ${context.selectedGuildId} in #${channel?.name ?? "unknown"}` };
  });

createDashboard({ ...designer.build() });
```

### Moderation Toggles + Limits

```ts
home: {
  getSections: async (context) => [
    {
      id: "moderation-core",
      title: "Moderation",
      scope: "guild",
      fields: [
        { id: "antiSpam", label: "Anti-Spam", type: "boolean", value: true },
        { id: "antiLinks", label: "Block Suspicious Links", type: "boolean", value: true },
        { id: "maxMentions", label: "Max Mentions", type: "number", value: 5 }
      ],
      actions: [{ id: "saveModeration", label: "Save Moderation", variant: "primary" }]
    }
  ],
  actions: {
    saveModeration: async (_context, payload) => ({
      ok: true,
      message: `Saved moderation: antiSpam=${Boolean(payload.values.antiSpam)}, maxMentions=${Number(payload.values.maxMentions ?? 0)}`,
      refresh: true
    })
  }
}
```

### Ticket Panel Builder (Plugin)

```ts
plugins: [
  {
    id: "tickets",
    name: "Tickets",
    scope: "guild",
    getPanels: async () => [
      {
        id: "ticket-panel",
        title: "Ticket Panel",
        fields: [
          { id: "targetChannel", label: "Target Channel", type: "channel-search", editable: true, value: "" },
          { id: "title", label: "Embed Title", type: "text", editable: true, value: "Need help?" },
          { id: "description", label: "Embed Description", type: "textarea", editable: true, value: "Click below to open a ticket." },
          { id: "buttonLabel", label: "Button Label", type: "text", editable: true, value: "Open Ticket" }
        ],
        actions: [{ id: "publishTicketPanel", label: "Publish", variant: "primary", collectFields: true }]
      }
    ],
    actions: {
      publishTicketPanel: async (_context, body) => {
        const data = body as { values?: Record<string, unknown> };
        const values = data.values ?? {};
        return { ok: true, message: `Ticket panel published as '${String(values.title ?? "Need help?")}'`, data: values };
      }
    }
  }
]
```

### Announcement Composer (with Role Mention)

```ts
plugins: [
  {
    id: "announcements",
    name: "Announcements",
    scope: "guild",
    getPanels: async () => [
      {
        id: "announce",
        title: "Announcement Composer",
        fields: [
          { id: "channel", label: "Channel", type: "channel-search", editable: true, value: "" },
          { id: "role", label: "Mention Role", type: "role-search", editable: true, value: "" },
          { id: "content", label: "Content", type: "textarea", editable: true, value: "Server update goes here..." }
        ],
        actions: [{ id: "sendAnnouncement", label: "Send", variant: "primary", collectFields: true }]
      }
    ],
    actions: {
      sendAnnouncement: async (_context, body) => {
        const payload = body as { values?: Record<string, unknown> };
        const channel = payload.values?.channel as { id?: string; name?: string } | null;
        const role = payload.values?.role as { id?: string; name?: string } | null;
        const mention = role?.id ? `<@&${role.id}> ` : "";
        const content = String(payload.values?.content ?? "");

        return {
          ok: true,
          message: `Announcement queued for #${channel?.name ?? "unknown"}`,
          data: { message: mention + content, channel }
        };
      }
    }
  }
]
```

## License

MIT
