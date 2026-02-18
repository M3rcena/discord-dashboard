import compression from "compression";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import helmet from "helmet";
import { createServer, type Server } from "node:http";
import { randomBytes } from "node:crypto";
import { createDiscordHelpers } from "./discord-helpers";
import { renderDashboardHtml } from "./templates";
import { getBuiltinTemplateRenderer } from "./templates/index";
import type {
  DashboardCard,
  DashboardContext,
  DashboardGuild,
  DashboardTemplateRenderer,
  DashboardScope,
  HomeCategory,
  HomeSection,
  DashboardInstance,
  DashboardOptions,
  DashboardPlugin,
  DashboardUser,
  PluginActionResult
} from "./types";

const DISCORD_API = "https://discord.com/api/v10";
const MANAGE_GUILD_PERMISSION = 0x20n;
const ADMIN_PERMISSION = 0x8n;

function normalizeBasePath(basePath?: string): string {
  if (!basePath || basePath === "/") {
    return "/dashboard";
  }

  return basePath.startsWith("/") ? basePath : `/${basePath}`;
}

function canManageGuild(permissions: string): boolean {
  const value = BigInt(permissions);
  return (value & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION || (value & ADMIN_PERMISSION) === ADMIN_PERMISSION;
}

function toQuery(params: Record<string, string>): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    url.set(key, value);
  }
  return url.toString();
}

async function fetchDiscord<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Discord API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function exchangeCodeForToken(options: DashboardOptions, code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: toQuery({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: options.redirectUri
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed token exchange: ${response.status} ${text}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

function createContext(req: Request, options: DashboardOptions): DashboardContext {
  const auth = req.session.discordAuth;
  if (!auth) {
    throw new Error("Not authenticated");
  }

  const selectedGuildId = typeof req.query.guildId === "string" ? req.query.guildId : undefined;
  return {
    user: auth.user,
    guilds: auth.guilds,
    accessToken: auth.accessToken,
    selectedGuildId,
    helpers: createDiscordHelpers(options.botToken)
  };
}

function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.discordAuth) {
    res.status(401).json({ authenticated: false, message: "Authentication required" });
    return;
  }

  next();
}

async function resolveOverviewCards(options: DashboardOptions, context: DashboardContext): Promise<DashboardCard[]> {
  if (options.getOverviewCards) {
    return await options.getOverviewCards(context);
  }

  const manageableGuildCount = context.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions)).length;

  return [
    {
      id: "user",
      title: "Logged-in User",
      value: context.user.global_name || context.user.username,
      subtitle: `ID: ${context.user.id}`,
      intent: "info"
    },
    {
      id: "guilds",
      title: "Manageable Guilds",
      value: manageableGuildCount,
      subtitle: "Owner or Manage Server permissions",
      intent: "success"
    },
    {
      id: "plugins",
      title: "Plugins Loaded",
      value: options.plugins?.length ?? 0,
      subtitle: "Dynamic server modules",
      intent: "neutral"
    }
  ];
}

async function resolveHomeSections(options: DashboardOptions, context: DashboardContext): Promise<HomeSection[]> {
  const customSections = options.home?.getSections ? await options.home.getSections(context) : [];
  const overviewSections = options.home?.getOverviewSections ? await options.home.getOverviewSections(context) : [];

  if (customSections.length > 0 || overviewSections.length > 0) {
    const normalizedOverview = overviewSections.map((section) => ({
      ...section,
      categoryId: section.categoryId ?? "overview"
    }));
    return [...normalizedOverview, ...customSections];
  }

  const selectedGuild = context.selectedGuildId
    ? context.guilds.find((guild) => guild.id === context.selectedGuildId)
    : undefined;

  return [
    {
      id: "setup",
      title: "Setup Details",
      description: "Core dashboard setup information",
      scope: "setup",
      categoryId: "setup",
      fields: [
        {
          id: "dashboardName",
          label: "Dashboard Name",
          type: "text",
          value: options.dashboardName ?? "Discord Dashboard",
          readOnly: true
        },
        {
          id: "basePath",
          label: "Base Path",
          type: "text",
          value: options.basePath ?? "/dashboard",
          readOnly: true
        }
      ]
    },
    {
      id: "context",
      title: "Dashboard Context",
      description: selectedGuild ? `Managing ${selectedGuild.name}` : "Managing user dashboard",
      scope: resolveScope(context),
      categoryId: "overview",
      fields: [
        {
          id: "mode",
          label: "Mode",
          type: "text",
          value: selectedGuild ? "Guild" : "User",
          readOnly: true
        },
        {
          id: "target",
          label: "Target",
          type: "text",
          value: selectedGuild ? selectedGuild.name : context.user.username,
          readOnly: true
        }
      ]
    }
  ];
}

function resolveScope(context: DashboardContext): DashboardScope {
  return context.selectedGuildId ? "guild" : "user";
}

async function resolveHomeCategories(options: DashboardOptions, context: DashboardContext): Promise<HomeCategory[]> {
  if (options.home?.getCategories) {
    const categories = await options.home.getCategories(context);
    return [...categories].sort((a, b) => {
      if (a.id === "overview") return -1;
      if (b.id === "overview") return 1;
      return 0;
    });
  }

  return [
    { id: "overview", label: "Overview", scope: resolveScope(context) },
    { id: "setup", label: "Setup", scope: "setup" }
  ];
}

function getUserAvatarUrl(user: DashboardUser): string | null {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }

  const fallbackIndex = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
}

function getGuildIconUrl(guild: DashboardGuild): string | null {
  if (!guild.icon) {
    return null;
  }

  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=128`;
}

function createGuildInviteUrl(options: DashboardOptions, guildId: string): string {
  const scopes = options.botInviteScopes && options.botInviteScopes.length > 0
    ? options.botInviteScopes
    : ["bot", "applications.commands"];

  return `https://discord.com/oauth2/authorize?${toQuery({
    client_id: options.clientId,
    scope: scopes.join(" "),
    permissions: options.botInvitePermissions ?? "8",
    guild_id: guildId,
    disable_guild_select: "true"
  })}`;
}

async function fetchBotGuildIds(botToken: string): Promise<Set<string>> {
  type BotGuild = { id: string };

  const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bot ${botToken}`
    }
  });

  if (!response.ok) {
    return new Set();
  }

  const guilds = (await response.json()) as BotGuild[];
  return new Set(guilds.map((guild) => guild.id));
}

function resolveTemplateRenderer(options: DashboardOptions): DashboardTemplateRenderer {
  const selectedTemplate = options.uiTemplate ?? "default";
  const defaultRenderer: DashboardTemplateRenderer = ({ dashboardName, basePath, setupDesign }) =>
    renderDashboardHtml(dashboardName, basePath, setupDesign);

  const customRenderer = options.uiTemplates?.[selectedTemplate];
  if (customRenderer) {
    return customRenderer;
  }

  const builtinRenderer = getBuiltinTemplateRenderer(selectedTemplate);
  if (builtinRenderer) {
    return builtinRenderer;
  }

  if (selectedTemplate !== "default") {
    throw new Error(`Unknown uiTemplate '${selectedTemplate}'. Register it in uiTemplates.`);
  }

  return defaultRenderer;
}

export function createDashboard(options: DashboardOptions): DashboardInstance {
  const app = options.app ?? express();
  const basePath = normalizeBasePath(options.basePath);
  const dashboardName = options.dashboardName ?? "Discord Dashboard";
  const templateRenderer = resolveTemplateRenderer(options);
  const plugins = options.plugins ?? [];

  if (!options.botToken) throw new Error("botToken is required");
  if (!options.clientId) throw new Error("clientId is required");
  if (!options.clientSecret) throw new Error("clientSecret is required");
  if (!options.redirectUri) throw new Error("redirectUri is required");
  if (!options.sessionSecret) throw new Error("sessionSecret is required");

  if (!options.app && options.trustProxy !== undefined) {
    app.set("trust proxy", options.trustProxy);
  }

  const router = express.Router();
  const sessionMiddleware = session({
    name: options.sessionName ?? "discord_dashboard.sid",
    secret: options.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: options.sessionMaxAgeMs ?? 1000 * 60 * 60 * 24 * 7
    }
  });

  router.use(compression());
  router.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  router.use(express.json());
  router.use(sessionMiddleware);

  router.get("/", (req, res) => {
    if (!req.session.discordAuth) {
      res.redirect(`${basePath}/login`);
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(templateRenderer({
      dashboardName,
      basePath,
      setupDesign: options.setupDesign
    }));
  });

  router.get("/login", (req, res) => {
    const state = randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const scope = (options.scopes && options.scopes.length > 0 ? options.scopes : ["identify", "guilds"]).join(" ");

    const query = toQuery({
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      response_type: "code",
      scope,
      state,
      prompt: "none"
    });

    res.redirect(`https://discord.com/oauth2/authorize?${query}`);
  });

  router.get("/callback", async (req, res) => {
    try {
      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;

      if (!code || !state) {
        res.status(400).send("Missing OAuth2 code/state");
        return;
      }

      if (!req.session.oauthState || req.session.oauthState !== state) {
        res.status(403).send("Invalid OAuth2 state");
        return;
      }

      const tokenData = await exchangeCodeForToken(options, code);
      const [user, guilds] = await Promise.all([
        fetchDiscord<DashboardUser>("/users/@me", tokenData.access_token),
        fetchDiscord<DashboardGuild[]>("/users/@me/guilds", tokenData.access_token)
      ]);

      req.session.discordAuth = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
        user,
        guilds
      };

      req.session.oauthState = undefined;
      res.redirect(basePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth callback failed";
      res.status(500).send(message);
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy((sessionError) => {
      if (sessionError) {
        res.status(500).json({ ok: false, message: "Failed to destroy session" });
        return;
      }

      res.clearCookie(options.sessionName ?? "discord_dashboard.sid");
      res.json({ ok: true });
    });
  });

  router.get("/api/session", (req, res) => {
    const auth = req.session.discordAuth;
    if (!auth) {
      res.status(200).json({ authenticated: false });
      return;
    }

    const manageableGuildCount = auth.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions)).length;

    res.json({
      authenticated: true,
      user: {
        ...auth.user,
        avatarUrl: getUserAvatarUrl(auth.user)
      },
      guildCount: manageableGuildCount,
      expiresAt: auth.expiresAt
    });
  });

  router.get("/api/guilds", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);

    if (options.ownerIds && options.ownerIds.length > 0 && !options.ownerIds.includes(context.user.id)) {
      res.status(403).json({ message: "You are not allowed to access this dashboard." });
      return;
    }

    let manageableGuilds = context.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions));

    if (options.guildFilter) {
      const filtered: DashboardGuild[] = [];
      for (const guild of manageableGuilds) {
        const allowed = await options.guildFilter(guild, context);
        if (allowed) {
          filtered.push(guild);
        }
      }
      manageableGuilds = filtered;
    }

    const botGuildIds = await fetchBotGuildIds(options.botToken);
    const enrichedGuilds = manageableGuilds.map((guild) => {
      const botInGuild = botGuildIds.has(guild.id);
      return {
        ...guild,
        iconUrl: getGuildIconUrl(guild),
        botInGuild,
        inviteUrl: botInGuild ? undefined : createGuildInviteUrl(options, guild.id)
      };
    });

    res.json({ guilds: enrichedGuilds });
  });

  router.get("/api/overview", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const cards = await resolveOverviewCards(options, context);
    res.json({ cards });
  });

  router.get("/api/home/categories", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const activeScope = resolveScope(context);
    const categories = await resolveHomeCategories(options, context);
    const visible = categories.filter((item) => item.scope === "setup" || item.scope === activeScope);
    res.json({ categories: visible, activeScope });
  });

  router.get("/api/home", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const activeScope = resolveScope(context);
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    let sections = await resolveHomeSections(options, context);

    sections = sections.filter((section) => {
      const sectionScope = section.scope ?? activeScope;
      if (sectionScope !== "setup" && sectionScope !== activeScope) {
        return false;
      }

      if (!categoryId) {
        return true;
      }

      return section.categoryId === categoryId;
    });

    res.json({ sections, activeScope });
  });

  router.get("/api/lookup/roles", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0
      ? req.query.guildId
      : context.selectedGuildId;

    if (!guildId) {
      res.status(400).json({ message: "guildId is required" });
      return;
    }

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const includeManaged = typeof req.query.includeManaged === "string"
      ? req.query.includeManaged === "true"
      : undefined;

    const roles = await context.helpers.searchGuildRoles(guildId, query, {
      limit: Number.isFinite(limit) ? limit : undefined,
      includeManaged
    });

    res.json({ roles });
  });

  router.get("/api/lookup/channels", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0
      ? req.query.guildId
      : context.selectedGuildId;

    if (!guildId) {
      res.status(400).json({ message: "guildId is required" });
      return;
    }

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const nsfw = typeof req.query.nsfw === "string"
      ? req.query.nsfw === "true"
      : undefined;
    const channelTypes = typeof req.query.channelTypes === "string"
      ? req.query.channelTypes
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item))
      : undefined;

    const channels = await context.helpers.searchGuildChannels(guildId, query, {
      limit: Number.isFinite(limit) ? limit : undefined,
      nsfw,
      channelTypes
    });

    res.json({ channels });
  });

  router.get("/api/lookup/members", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0
      ? req.query.guildId
      : context.selectedGuildId;

    if (!guildId) {
      res.status(400).json({ message: "guildId is required" });
      return;
    }

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const members = await context.helpers.searchGuildMembers(guildId, query, {
      limit: Number.isFinite(limit) ? limit : undefined
    });

    res.json({ members });
  });

  router.post("/api/home/:actionId", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const action = options.home?.actions?.[req.params.actionId];

    if (!action) {
      res.status(404).json({ ok: false, message: "Home action not found" });
      return;
    }

    const payload = req.body as { sectionId?: string; values?: Record<string, unknown> };
    if (!payload || typeof payload.sectionId !== "string" || !payload.values || typeof payload.values !== "object") {
      res.status(400).json({ ok: false, message: "Invalid home action payload" });
      return;
    }

    let result: PluginActionResult;
    try {
      result = await action(context, {
        sectionId: payload.sectionId,
        values: payload.values
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Home action failed";
      res.status(500).json({ ok: false, message });
      return;
    }

    res.json(result);
  });

  router.get("/api/plugins", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const activeScope = context.selectedGuildId ? "guild" : "user";
    const payload = [] as Array<{ id: string; name: string; description?: string; panels: unknown[] }>;

    for (const plugin of plugins) {
      const pluginScope = plugin.scope ?? "both";
      if (pluginScope !== "both" && pluginScope !== activeScope) {
        continue;
      }

      const panels = await plugin.getPanels(context);
      payload.push({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        panels
      });
    }

    res.json({ plugins: payload });
  });

  router.post("/api/plugins/:pluginId/:actionId", ensureAuthenticated, async (req, res) => {
    const context = createContext(req, options);
    const plugin = plugins.find((item) => item.id === req.params.pluginId) as DashboardPlugin | undefined;

    if (!plugin) {
      res.status(404).json({ ok: false, message: "Plugin not found" });
      return;
    }

    const action = plugin.actions?.[req.params.actionId];
    if (!action) {
      res.status(404).json({ ok: false, message: "Action not found" });
      return;
    }

    let result: PluginActionResult;
    try {
      result = await action(context, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Plugin action failed";
      res.status(500).json({ ok: false, message });
      return;
    }

    res.json(result);
  });

  app.use(basePath, router);

  let server: Server | undefined;

  return {
    app,
    async start() {
      if (options.app) {
        return;
      }

      if (server) {
        return;
      }

      const port = options.port ?? 3000;
      const host = options.host ?? "0.0.0.0";

      server = createServer(app);
      await new Promise<void>((resolve) => {
        server!.listen(port, host, () => resolve());
      });
    },
    async stop() {
      if (!server) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      server = undefined;
    }
  };
}
