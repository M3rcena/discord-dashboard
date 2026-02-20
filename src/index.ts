import compression from "compression";
import express, { Router, type Express, type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import helmet from "helmet";
import { randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import { DiscordHelpers } from "./handlers/DiscordHelpers";
import { TemplateManager } from "./handlers/TemplateManager";
import type { DashboardCard, DashboardContext, DashboardGuild, DashboardInstance, DashboardOptions, DashboardPlugin, DashboardScope, DashboardTemplateRenderer, DashboardUser, HomeCategory, HomeSection } from "./Types";

const DISCORD_API = "https://discord.com/api/v10";
const MANAGE_GUILD_PERMISSION = 0x20n;
const ADMIN_PERMISSION = 0x8n;

// -- Helper Functions --
function normalizeBasePath(basePath?: string): string {
  if (!basePath || basePath === "/") return "/dashboard";
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
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Discord API request failed (${response.status})`);
  return (await response.json()) as T;
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
  if (!guild.icon) return null;
  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=128`;
}

export class DiscordDashboard implements DashboardInstance {
  public app: Express;
  public options: DashboardOptions;
  public helpers: DiscordHelpers;

  private router: Router;
  private server?: Server;
  private basePath: string;
  private templateRenderer: DashboardTemplateRenderer;
  private templateManager: TemplateManager;
  private plugins: DashboardPlugin[];

  constructor(options: DashboardOptions) {
    this.validateOptions(options);

    this.options = options;
    this.app = options.app ?? express();
    this.router = express.Router();
    this.helpers = new DiscordHelpers(options.botToken);
    this.basePath = normalizeBasePath(options.basePath);
    this.templateManager = new TemplateManager(this.options);
    this.templateRenderer = this.templateManager.resolveRenderer();
    this.plugins = options.plugins ?? [];

    if (!options.app && options.trustProxy !== undefined) {
      this.app.set("trust proxy", options.trustProxy);
    }

    this.setupMiddleware();
    this.setupRoutes();
    this.app.use(this.basePath, this.router);
  }

  private validateOptions(options: DashboardOptions) {
    if (!options.botToken) throw new Error("botToken is required");
    if (!options.clientId) throw new Error("clientId is required");
    if (!options.clientSecret) throw new Error("clientSecret is required");
    if (!options.redirectUri) throw new Error("redirectUri is required");
    if (!options.sessionSecret) throw new Error("sessionSecret is required");
  }

  private setupMiddleware() {
    this.router.use(compression());
    this.router.use(helmet({ contentSecurityPolicy: false }));
    this.router.use(express.json());
    this.router.use(
      session({
        name: this.options.sessionName ?? "discord_dashboard.sid",
        secret: this.options.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: "lax",
          maxAge: this.options.sessionMaxAgeMs ?? 1000 * 60 * 60 * 24 * 7,
        },
      }),
    );
  }

  private setupRoutes() {
    // Basic Routes
    this.router.get("/", this.handleRoot.bind(this));
    this.router.get("/login", this.handleLogin.bind(this));
    this.router.get("/callback", this.handleCallback.bind(this));
    this.router.post("/logout", this.handleLogout.bind(this));

    // API Routes (Authenticated)
    this.router.get("/api/session", this.handleSession.bind(this));
    this.router.get("/api/guilds", this.ensureAuthenticated, this.handleGuilds.bind(this));
    this.router.get("/api/overview", this.ensureAuthenticated, this.handleOverview.bind(this));
    this.router.get("/api/home/categories", this.ensureAuthenticated, this.handleHomeCategories.bind(this));
    this.router.get("/api/home", this.ensureAuthenticated, this.handleHome.bind(this));

    // Lookups
    this.router.get("/api/lookup/roles", this.ensureAuthenticated, this.handleLookupRoles.bind(this));
    this.router.get("/api/lookup/channels", this.ensureAuthenticated, this.handleLookupChannels.bind(this));
    this.router.get("/api/lookup/members", this.ensureAuthenticated, this.handleLookupMembers.bind(this));

    // Actions & Plugins
    this.router.post("/api/home/:actionId", this.ensureAuthenticated, this.handleHomeAction.bind(this));
    this.router.get("/api/plugins", this.ensureAuthenticated, this.handlePlugins.bind(this));
    this.router.post("/api/plugins/:pluginId/:actionId", this.ensureAuthenticated, this.handlePluginAction.bind(this));
  }

  // --- Start/Stop Methods ---
  public async start(): Promise<void> {
    if (this.options.app || this.server) return;

    const port = this.options.port ?? 3000;
    const host = this.options.host ?? "0.0.0.0";

    this.server = createServer(this.app);
    return new Promise<void>((resolve) => {
      this.server!.listen(port, host, () => resolve());
    });
  }

  public async stop(): Promise<void> {
    if (!this.server) return;

    return new Promise<void>((resolve, reject) => {
      this.server!.close((error) => {
        if (error) return reject(error);
        resolve();
      });
      this.server = undefined;
    });
  }

  // --- Route Handlers ---
  private handleRoot(req: Request, res: Response) {
    if (!req.session.discordAuth) {
      res.redirect(`${this.basePath}/login`);
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(
      this.templateRenderer({
        dashboardName: this.options.dashboardName ?? "Discord Dashboard",
        basePath: this.basePath,
        setupDesign: this.options.setupDesign,
      }),
    );
  }

  private handleLogin(req: Request, res: Response) {
    const state = randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const scope = (this.options.scopes && this.options.scopes.length > 0 ? this.options.scopes : ["identify", "guilds"]).join(" ");

    const query = toQuery({
      client_id: this.options.clientId,
      redirect_uri: this.options.redirectUri,
      response_type: "code",
      scope,
      state,
      prompt: "none",
    });

    res.redirect(`https://discord.com/oauth2/authorize?${query}`);
  }

  private async handleCallback(req: Request, res: Response) {
    try {
      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;

      if (!code || !state) return res.status(400).send("Missing OAuth2 code/state");
      if (!req.session.oauthState || req.session.oauthState !== state) return res.status(403).send("Invalid OAuth2 state");

      const tokenData = await this.exchangeCodeForToken(code);
      const [user, guilds] = await Promise.all([fetchDiscord<DashboardUser>("/users/@me", tokenData.access_token), fetchDiscord<DashboardGuild[]>("/users/@me/guilds", tokenData.access_token)]);

      req.session.discordAuth = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
        user,
        guilds,
      };

      req.session.oauthState = undefined;
      res.redirect(this.basePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth callback failed";
      res.status(500).send(message);
    }
  }

  private handleLogout(req: Request, res: Response) {
    req.session.destroy((sessionError) => {
      if (sessionError) return res.status(500).json({ ok: false, message: "Failed to destroy session" });
      res.clearCookie(this.options.sessionName ?? "discord_dashboard.sid");
      res.json({ ok: true });
    });
  }

  private handleSession(req: Request, res: Response) {
    const auth = req.session.discordAuth;
    if (!auth) return res.status(200).json({ authenticated: false });

    const manageableGuildCount = auth.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions)).length;

    res.json({
      authenticated: true,
      user: { ...auth.user, avatarUrl: getUserAvatarUrl(auth.user) },
      guildCount: manageableGuildCount,
      expiresAt: auth.expiresAt,
    });
  }

  private async handleGuilds(req: Request, res: Response) {
    const context = this.createContext(req);

    if (this.options.ownerIds && this.options.ownerIds.length > 0 && !this.options.ownerIds.includes(context.user.id)) {
      return res.status(403).json({ message: "You are not allowed to access this dashboard." });
    }

    let manageableGuilds = context.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions));

    if (this.options.guildFilter) {
      const filtered: DashboardGuild[] = [];
      for (const guild of manageableGuilds) {
        if (await this.options.guildFilter(guild, context)) filtered.push(guild);
      }
      manageableGuilds = filtered;
    }

    const botGuildIds = await this.fetchBotGuildIds();
    const enrichedGuilds = manageableGuilds.map((guild) => {
      const botInGuild = botGuildIds.has(guild.id);
      return {
        ...guild,
        iconUrl: getGuildIconUrl(guild),
        botInGuild,
        inviteUrl: botInGuild ? undefined : this.createGuildInviteUrl(guild.id),
      };
    });

    res.json({ guilds: enrichedGuilds });
  }

  private async handleOverview(req: Request, res: Response) {
    const context = this.createContext(req);
    const cards = await this.resolveOverviewCards(context);
    res.json({ cards });
  }

  private async handleHomeCategories(req: Request, res: Response) {
    const context = this.createContext(req);
    const activeScope = this.resolveScope(context);
    const categories = await this.resolveHomeCategories(context);
    const visible = categories.filter((item) => item.scope === "setup" || item.scope === activeScope);
    res.json({ categories: visible, activeScope });
  }

  private async handleHome(req: Request, res: Response) {
    const context = this.createContext(req);
    const activeScope = this.resolveScope(context);
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    let sections = await this.resolveHomeSections(context);

    sections = sections.filter((section) => {
      const sectionScope = section.scope ?? activeScope;
      if (sectionScope !== "setup" && sectionScope !== activeScope) return false;
      if (!categoryId) return true;
      return section.categoryId === categoryId;
    });

    res.json({ sections, activeScope });
  }

  private async handleLookupRoles(req: Request, res: Response) {
    const context = this.createContext(req);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0 ? req.query.guildId : context.selectedGuildId;

    if (!guildId) return res.status(400).json({ message: "guildId is required" });

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const includeManaged = typeof req.query.includeManaged === "string" ? req.query.includeManaged === "true" : undefined;

    const roles = await context.helpers.searchGuildRoles(guildId, query, { limit: Number.isFinite(limit) ? limit : undefined, includeManaged });
    res.json({ roles });
  }

  private async handleLookupChannels(req: Request, res: Response) {
    const context = this.createContext(req);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0 ? req.query.guildId : context.selectedGuildId;

    if (!guildId) return res.status(400).json({ message: "guildId is required" });

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const nsfw = typeof req.query.nsfw === "string" ? req.query.nsfw === "true" : undefined;
    const channelTypes =
      typeof req.query.channelTypes === "string"
        ? req.query.channelTypes
            .split(",")
            .map((item) => Number(item.trim()))
            .filter((item) => Number.isFinite(item))
        : undefined;

    const channels = await context.helpers.searchGuildChannels(guildId, query, { limit: Number.isFinite(limit) ? limit : undefined, nsfw, channelTypes });
    res.json({ channels });
  }

  private async handleLookupMembers(req: Request, res: Response) {
    const context = this.createContext(req);
    const guildId = typeof req.query.guildId === "string" && req.query.guildId.length > 0 ? req.query.guildId : context.selectedGuildId;

    if (!guildId) return res.status(400).json({ message: "guildId is required" });

    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const members = await context.helpers.searchGuildMembers(guildId, query, { limit: Number.isFinite(limit) ? limit : undefined });

    res.json({ members });
  }

  private async handleHomeAction(req: Request, res: Response) {
    const context = this.createContext(req);
    const action = this.options.home?.actions?.[req.params.actionId];

    if (!action) return res.status(404).json({ ok: false, message: "Home action not found" });

    const payload = req.body as { sectionId?: string; values?: Record<string, unknown> };
    if (!payload || typeof payload.sectionId !== "string" || !payload.values || typeof payload.values !== "object") {
      return res.status(400).json({ ok: false, message: "Invalid home action payload" });
    }

    try {
      const result = await action(context, { sectionId: payload.sectionId, values: payload.values });
      res.json(result);
    } catch (error) {
      res.status(500).json({ ok: false, message: error instanceof Error ? error.message : "Home action failed" });
    }
  }

  private async handlePlugins(req: Request, res: Response) {
    const context = this.createContext(req);
    const activeScope = context.selectedGuildId ? "guild" : "user";
    const payload = [];

    for (const plugin of this.plugins) {
      const pluginScope = plugin.scope ?? "both";
      if (pluginScope !== "both" && pluginScope !== activeScope) continue;

      const panels = await plugin.getPanels(context);
      payload.push({ id: plugin.id, name: plugin.name, description: plugin.description, panels });
    }

    res.json({ plugins: payload });
  }

  private async handlePluginAction(req: Request, res: Response) {
    const context = this.createContext(req);
    const plugin = this.plugins.find((item) => item.id === req.params.pluginId);

    if (!plugin) return res.status(404).json({ ok: false, message: "Plugin not found" });

    const action = plugin.actions?.[req.params.actionId];
    if (!action) return res.status(404).json({ ok: false, message: "Action not found" });

    try {
      const result = await action(context, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ ok: false, message: error instanceof Error ? error.message : "Plugin action failed" });
    }
  }

  // --- Internal Dashboard Resolvers & Helpers ---
  private ensureAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.discordAuth) {
      res.status(401).json({ authenticated: false, message: "Authentication required" });
      return;
    }
    next();
  };

  private createContext(req: Request): DashboardContext {
    const auth = req.session.discordAuth;
    if (!auth) throw new Error("Not authenticated");

    return {
      user: auth.user,
      guilds: auth.guilds,
      accessToken: auth.accessToken,
      selectedGuildId: typeof req.query.guildId === "string" ? req.query.guildId : undefined,
      helpers: this.helpers,
    };
  }

  private async exchangeCodeForToken(code: string) {
    const response = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toQuery({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.options.redirectUri,
      }),
    });

    if (!response.ok) throw new Error(`Failed token exchange: ${response.status} ${await response.text()}`);
    return (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  }

  private async resolveOverviewCards(context: DashboardContext): Promise<DashboardCard[]> {
    if (this.options.getOverviewCards) return await this.options.getOverviewCards(context);

    const manageableGuildCount = context.guilds.filter((guild) => guild.owner || canManageGuild(guild.permissions)).length;

    return [
      { id: "user", title: "Logged-in User", value: context.user.global_name || context.user.username, subtitle: `ID: ${context.user.id}`, intent: "info" },
      { id: "guilds", title: "Manageable Guilds", value: manageableGuildCount, subtitle: "Owner or Manage Server permissions", intent: "success" },
      { id: "plugins", title: "Plugins Loaded", value: this.plugins.length, subtitle: "Dynamic server modules", intent: "neutral" },
    ];
  }

  private async resolveHomeSections(context: DashboardContext): Promise<HomeSection[]> {
    const customSections = this.options.home?.getSections ? await this.options.home.getSections(context) : [];
    const overviewSections = this.options.home?.getOverviewSections ? await this.options.home.getOverviewSections(context) : [];

    if (customSections.length > 0 || overviewSections.length > 0) {
      const normalizedOverview = overviewSections.map((section) => ({ ...section, categoryId: section.categoryId ?? "overview" }));
      return [...normalizedOverview, ...customSections];
    }

    const selectedGuild = context.selectedGuildId ? context.guilds.find((guild) => guild.id === context.selectedGuildId) : undefined;

    return [
      {
        id: "setup",
        title: "Setup Details",
        description: "Core dashboard setup information",
        scope: "setup",
        categoryId: "setup",
        fields: [
          { id: "dashboardName", label: "Dashboard Name", type: "text", value: this.options.dashboardName ?? "Discord Dashboard", readOnly: true },
          { id: "basePath", label: "Base Path", type: "text", value: this.basePath, readOnly: true },
        ],
      },
      {
        id: "context",
        title: "Dashboard Context",
        description: selectedGuild ? `Managing ${selectedGuild.name}` : "Managing user dashboard",
        scope: this.resolveScope(context),
        categoryId: "overview",
        fields: [
          { id: "mode", label: "Mode", type: "text", value: selectedGuild ? "Guild" : "User", readOnly: true },
          { id: "target", label: "Target", type: "text", value: selectedGuild ? selectedGuild.name : context.user.username, readOnly: true },
        ],
      },
    ];
  }

  private resolveScope(context: DashboardContext): DashboardScope {
    return context.selectedGuildId ? "guild" : "user";
  }

  private async resolveHomeCategories(context: DashboardContext): Promise<HomeCategory[]> {
    if (this.options.home?.getCategories) {
      const categories = await this.options.home.getCategories(context);
      return [...categories].sort((a, b) => (a.id === "overview" ? -1 : b.id === "overview" ? 1 : 0));
    }
    return [
      { id: "overview", label: "Overview", scope: this.resolveScope(context) },
      { id: "setup", label: "Setup", scope: "setup" },
    ];
  }

  private createGuildInviteUrl(guildId: string): string {
    const scopes = this.options.botInviteScopes && this.options.botInviteScopes.length > 0 ? this.options.botInviteScopes : ["bot", "applications.commands"];
    return `https://discord.com/oauth2/authorize?${toQuery({
      client_id: this.options.clientId,
      scope: scopes.join(" "),
      permissions: this.options.botInvitePermissions ?? "8",
      guild_id: guildId,
      disable_guild_select: "true",
    })}`;
  }

  private async fetchBotGuildIds(): Promise<Set<string>> {
    const response = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers: { Authorization: `Bot ${this.options.botToken}` } });
    if (!response.ok) return new Set();
    const guilds = (await response.json()) as { id: string }[];
    return new Set(guilds.map((guild) => guild.id));
  }

}

export { DashboardDesigner } from "./handlers/DashboardDesigner";
export { DiscordHelpers } from "./handlers/DiscordHelpers";
export { TemplateManager } from "./handlers/TemplateManager";
export { builtinTemplateRenderers, getBuiltinTemplateRenderer } from "./templates";
export * from "./Types";
