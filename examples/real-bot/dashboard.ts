import type { Express } from "express";
import type { Client } from "discord.js";
import { DiscordDashboard, DashboardDesigner } from "../../src";
import type { BotConfig } from "./types";
import type { DemoStateStore } from "./state-store";

export function createBotDashboard(options: { app: Express; config: BotConfig; store: DemoStateStore; client: Client; commandCount: number }) {
  const { app, config, store, client, commandCount } = options;

  const flexibleDesigner = new DashboardDesigner({
    app,
    basePath: config.dashboardBasePath,
    dashboardName: config.dashboardName,
    botToken: config.botToken,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    sessionSecret: config.sessionSecret,
  })
    .setupPage({
      id: "profile-flex",
      title: "Profile (Flex API)",
      label: "Profile Flex",
      categoryId: "profile-flex",
      scope: "user",
      width: 50,
      description: "This page uses setupPage + onLoad + onSave.",
      fields: [
        { id: "flexBio", label: "Bio", type: "textarea", value: "" },
        { id: "flexPetName", label: "Favorite Pet", type: "text", value: "Luna" },
        { id: "flexPetNotifications", label: "Pet Notifications", type: "boolean", value: true },
      ],
    })
    .setupPage({
      id: "guild-flex",
      title: "Guild (Flex API)",
      label: "Guild Flex",
      categoryId: "guild-flex",
      scope: "guild",
      width: 50,
      description: "Guild page using setupPage + onload + onsave.",
      fields: [
        { id: "flexGuildPrefix", label: "Prefix", type: "text", value: "!" },
        { id: "flexGuildLog", label: "Log Channel ID", type: "text", value: "" },
        { id: "flexGuildWelcome", label: "Welcome Channel ID", type: "text", value: "" },
        { id: "flexGuildModeration", label: "Moderation Enabled", type: "boolean", value: true },
      ],
    })
    .onLoad("profile-flex", async (context, section) => {
      const userState = await store.getUserState(context.user.id);
      return {
        ...section,
        description: `Loaded via onLoad for ${context.user.username}`,
        fields: [
          { id: "flexBio", label: "Bio", type: "textarea", value: userState.profileBio },
          { id: "flexPetName", label: "Favorite Pet", type: "text", value: userState.favoritePetName },
          { id: "flexPetNotifications", label: "Pet Notifications", type: "boolean", value: userState.petNotifications },
        ],
      };
    })
    .onSave("profile-flex", async (context, payload) => {
      await store.update("dashboard:onSave:profile-flex", context.user.username, (state) => {
        const current = state.users[context.user.id] ?? {
          profileBio: "",
          petsEnabled: true,
          favoritePetName: "Luna",
          petNotifications: true,
        };

        state.users[context.user.id] = {
          ...current,
          profileBio: String(payload.values.flexBio ?? ""),
          favoritePetName: String(payload.values.flexPetName ?? "Luna"),
          petNotifications: Boolean(payload.values.flexPetNotifications),
          updatedAt: new Date().toISOString(),
        };
      });

      return { ok: true, message: "Saved via onSave(profile-flex)", refresh: true };
    })
    .onload("guild-flex", async (context, section) => {
      if (!context.selectedGuildId) {
        return {
          ...section,
          description: "Select a guild from the left rail to use this page.",
        };
      }

      const guildState = await store.getGuildState(context.selectedGuildId);
      return {
        ...section,
        description: `Loaded via onload for guild ${context.selectedGuildId}`,
        fields: [
          { id: "flexGuildPrefix", label: "Prefix", type: "text", value: guildState.prefix },
          { id: "flexGuildLog", label: "Log Channel ID", type: "text", value: guildState.logChannelId },
          { id: "flexGuildWelcome", label: "Welcome Channel ID", type: "text", value: guildState.welcomeChannelId },
          { id: "flexGuildModeration", label: "Moderation Enabled", type: "boolean", value: guildState.moderationEnabled },
        ],
      };
    })
    .onsave("guild-flex", async (context, payload) => {
      if (!context.selectedGuildId) {
        return { ok: false, message: "Select a guild first" };
      }

      await store.update("dashboard:onsave:guild-flex", context.user.username, (state) => {
        const current = state.guilds[context.selectedGuildId!] ?? {
          prefix: "!",
          moderationEnabled: true,
          logChannelId: "",
          welcomeChannelId: "",
          pollButtons: ["✅ Yes", "❌ No"],
          pollMessage: "What should we do for the next event?",
        };

        state.guilds[context.selectedGuildId!] = {
          ...current,
          prefix: String(payload.values.flexGuildPrefix ?? current.prefix),
          logChannelId: String(payload.values.flexGuildLog ?? current.logChannelId),
          welcomeChannelId: String(payload.values.flexGuildWelcome ?? current.welcomeChannelId),
          moderationEnabled: Boolean(payload.values.flexGuildModeration),
          updatedAt: new Date().toISOString(),
        };
      });

      return { ok: true, message: "Saved via onsave(guild-flex)", refresh: true };
    });

  const flexibleOptions = flexibleDesigner.build();
  const flexibleHome = flexibleOptions.home;

  const mergeCategories = (input: Array<{ id: string; label: string; scope: "setup" | "user" | "guild"; description?: string }>) => {
    const map = new Map<string, (typeof input)[number]>();
    for (const category of input) {
      const key = `${category.scope}:${category.id}`;
      if (!map.has(key)) {
        map.set(key, category);
      }
    }

    return [...map.values()];
  };

  return new DiscordDashboard({
    app,
    basePath: config.dashboardBasePath,
    dashboardName: config.dashboardName,
    uiTemplate: "compact",
    setupDesign: {
      primary: "#6366f1",
      rail: "#0f172a",
      panel: "rgba(30, 41, 59, 0.7)", // Semi-transparent for glass effect
      panel2: "rgba(51, 65, 85, 0.8)",
      border: "rgba(255, 255, 255, 0.08)",
      customCss: `
          /* 1. Force a bright gradient background */
          body {
            background: linear-gradient(45deg, #1a0033 0%, #4b0082 100%) !important;
            background-attachment: fixed !important;
          }
  
          /* 2. Give every panel a glowing pink border and rounded corners */
          .panel, .container {
            border: 2px solid #ff007f !important;
            box-shadow: 0 0 20px rgba(255, 0, 127, 0.4) !important;
            border-radius: 20px !important;
            background: rgba(20, 0, 20, 0.8) !important;
            backdrop-filter: blur(10px);
          }
  
          /* 3. Make the server rail stand out with a neon line */
          .sidebar {
            border-right: 3px solid #ff007f !important;
            background: #110011 !important;
          }
  
          /* 4. Make all buttons have a "glow" effect */
          button {
            border: 1px solid #ff007f !important;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 2px;
          }
  
          button.primary {
            background: #ff007f !important;
            box-shadow: 0 0 15px #ff007f !important;
            color: white !important;
          }
  
          /* 5. Change the text color of titles to neon pink */
          .section-title, .brand, .center-title {
            color: #ff007f !important;
            text-shadow: 0 0 10px #ff007f;
            font-size: 1.5rem !important;
          }
  
          /* 6. Make labels bright cyan for contrast */
          label {
            color: #00ffff !important;
            font-weight: bold !important;
          }
        `,
    },
    botToken: config.botToken,
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
          value: commandCount,
          subtitle: config.devGuildId ? "Guild scoped registration" : "Global registration",
        },
        {
          id: "events",
          title: "Tracked Guilds",
          value: Object.keys(state.guilds).length,
          subtitle: "Persisted in live JSON state",
        },
        {
          id: "saves",
          title: "JSON Saves",
          value: state.meta.saveCount,
          subtitle: state.meta.lastAction,
        },
      ];
    },
    home: {
      getCategories: async (context) => {
        const flexibleCategories = flexibleHome?.getCategories ? await flexibleHome.getCategories(context) : [];

        if (context.selectedGuildId) {
          return mergeCategories([{ id: "overview", label: "Overview", scope: "guild" }, { id: "guild", label: "Guild Config", scope: "guild" }, { id: "setup", label: "Setup", scope: "setup" }, ...flexibleCategories]);
        }

        return mergeCategories([{ id: "overview", label: "Overview", scope: "user" }, { id: "profile", label: "Profile", scope: "user" }, { id: "setup", label: "Setup", scope: "setup" }, ...flexibleCategories]);
      },
      getSections: async (context) => {
        const flexibleSections = flexibleHome?.getSections ? await flexibleHome.getSections(context) : [];
        const state = await store.read();
        const userState = await store.getUserState(context.user.id);
        const guildState = context.selectedGuildId ? await store.getGuildState(context.selectedGuildId) : null;

        const setupSection = {
          id: "live-json-state",
          title: "Live JSON State",
          description: "All dashboard saves and bot events persist to one JSON file.",
          width: 50 as const,
          scope: "setup" as const,
          categoryId: "setup",
          fields: [
            { id: "file", label: "State File", type: "text" as const, value: store.filePath, readOnly: true },
            { id: "lastAction", label: "Last Action", type: "text" as const, value: state.meta.lastAction, readOnly: true },
            { id: "lastUpdatedBy", label: "Last Updated By", type: "text" as const, value: state.meta.lastUpdatedBy, readOnly: true },
            { id: "lastUpdatedAt", label: "Last Updated At", type: "text" as const, value: state.meta.lastUpdatedAt, readOnly: true },
          ],
        };

        if (!context.selectedGuildId) {
          return [
            {
              id: "user-overview",
              title: "User Overview",
              description: "Live user profile data loaded from JSON.",
              width: 50,
              scope: "user",
              categoryId: "overview",
              fields: [
                { id: "bioLive", label: "Profile Bio", type: "textarea", value: userState.profileBio || "(empty)", readOnly: true },
                { id: "petsLive", label: "Pets Enabled", type: "boolean", value: userState.petsEnabled, readOnly: true },
                { id: "petNameLive", label: "Favorite Pet", type: "text", value: userState.favoritePetName, readOnly: true },
                { id: "petNotifyLive", label: "Pet Notifications", type: "boolean", value: userState.petNotifications, readOnly: true },
              ],
            },
            {
              id: "user-profile",
              title: "Edit User Profile",
              description: "Save values and watch JSON + cards update in real time.",
              width: 50,
              scope: "user",
              categoryId: "profile",
              fields: [
                { id: "profileBio", label: "Profile Bio", type: "textarea", value: userState.profileBio },
                { id: "petsEnabled", label: "Enable Pets", type: "boolean", value: userState.petsEnabled },
                { id: "favoritePetName", label: "Favorite Pet", type: "text", value: userState.favoritePetName },
                { id: "petNotifications", label: "Pet Notifications", type: "boolean", value: userState.petNotifications },
              ],
              actions: [{ id: "saveUserProfile", label: "Save Profile", variant: "primary" }],
            },
            setupSection,
            ...flexibleSections,
          ];
        }

        return [
          {
            id: "guild-overview",
            title: "Guild Overview",
            description: "Current guild values from JSON-backed storage.",
            width: 50,
            scope: "guild",
            categoryId: "overview",
            fields: [
              { id: "prefixView", label: "Prefix", type: "text", value: guildState?.prefix ?? "!", readOnly: true },
              { id: "modView", label: "Moderation", type: "boolean", value: guildState?.moderationEnabled ?? true, readOnly: true },
              { id: "eventView", label: "Last Event", type: "text", value: guildState?.lastEvent ?? "none", readOnly: true },
              { id: "cmdView", label: "Last Command At", type: "text", value: guildState?.lastCommandAt ?? "never", readOnly: true },
            ],
          },
          {
            id: "guild-settings",
            title: "Guild Settings",
            description: "These settings are shared with command/event handlers.",
            width: 50,
            scope: "guild",
            categoryId: "guild",
            fields: [
              { id: "prefix", label: "Prefix", type: "text", value: guildState?.prefix ?? "!" },
              { id: "moderationEnabled", label: "Moderation Enabled", type: "boolean", value: guildState?.moderationEnabled ?? true },
              { id: "logChannelId", label: "Log Channel ID", type: "text", value: guildState?.logChannelId ?? "" },
              { id: "welcomeChannelId", label: "Welcome Channel ID", type: "text", value: guildState?.welcomeChannelId ?? "" },
              { id: "pollMessage", label: "Poll Message", type: "textarea", value: guildState?.pollMessage ?? "" },
              { id: "pollButtons", label: "Poll Buttons", type: "string-list", value: guildState?.pollButtons ?? ["✅ Yes", "❌ No"] },
            ],
            actions: [{ id: "saveGuildSettings", label: "Save Guild Settings", variant: "primary" }],
          },
          setupSection,
          ...flexibleSections,
        ];
      },
      actions: {
        ...(flexibleHome?.actions ?? {}),
        saveUserProfile: async (context, payload) => {
          await store.update("dashboard:saveUserProfile", context.user.username, (state) => {
            const current = state.users[context.user.id] ?? {
              profileBio: "",
              petsEnabled: true,
              favoritePetName: "Luna",
              petNotifications: true,
            };

            state.users[context.user.id] = {
              ...current,
              profileBio: String(payload.values.profileBio ?? ""),
              petsEnabled: Boolean(payload.values.petsEnabled),
              favoritePetName: String(payload.values.favoritePetName ?? "Luna"),
              petNotifications: Boolean(payload.values.petNotifications),
              updatedAt: new Date().toISOString(),
            };
          });

          return { ok: true, message: "User profile saved to JSON", refresh: true };
        },
        saveGuildSettings: async (context, payload) => {
          if (!context.selectedGuildId) {
            return { ok: false, message: "Select a guild first" };
          }

          await store.update("dashboard:saveGuildSettings", context.user.username, (state) => {
            const current = state.guilds[context.selectedGuildId!] ?? {
              prefix: "!",
              moderationEnabled: true,
              logChannelId: "",
              welcomeChannelId: "",
              pollButtons: ["✅ Yes", "❌ No"],
              pollMessage: "What should we do for the next event?",
            };

            const buttons = Array.isArray(payload.values.pollButtons) ? payload.values.pollButtons.map((item) => String(item)).filter((item) => item.length > 0) : current.pollButtons;

            state.guilds[context.selectedGuildId!] = {
              ...current,
              prefix: String(payload.values.prefix ?? "!"),
              moderationEnabled: Boolean(payload.values.moderationEnabled),
              logChannelId: String(payload.values.logChannelId ?? ""),
              welcomeChannelId: String(payload.values.welcomeChannelId ?? ""),
              pollMessage: String(payload.values.pollMessage ?? current.pollMessage),
              pollButtons: buttons.length > 0 ? buttons : ["✅ Yes", "❌ No"],
              updatedAt: new Date().toISOString(),
            };
          });

          return { ok: true, message: "Guild settings saved to JSON", refresh: true };
        },
      },
    },
    plugins: [
      {
        id: "runtime",
        name: "Runtime",
        description: "Bot runtime and process diagnostics",
        scope: "user",
        getPanels: async () => {
          const state = await store.read();
          return [
            {
              id: "runtime-status",
              title: "Runtime Status",
              fields: [
                { label: "Bot User", value: client.user?.tag ?? "Not logged in" },
                { label: "Guild Cache", value: client.guilds.cache.size },
                { label: "Node Uptime", value: `${Math.floor(process.uptime())}s` },
                { label: "Memory RSS", value: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB` },
                { label: "Saved Actions", value: state.meta.saveCount },
              ],
              actions: [{ id: "refreshRuntime", label: "Refresh", variant: "primary" }],
            },
          ];
        },
        actions: {
          refreshRuntime: async () => ({ ok: true, message: "Runtime data refreshed", refresh: true }),
        },
      },
    ],
  });
}
