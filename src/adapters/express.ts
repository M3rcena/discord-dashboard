import compression from "compression";
import express, { Router, type Express } from "express";
import session from "express-session";
import helmet from "helmet";
import { randomBytes } from "node:crypto";
import { DashboardEngine } from "../core/DashboardEngine";
import type { DashboardContext, DashboardOptions } from "../Types";

export function createExpressAdapter(options: DashboardOptions) {
  const engine = new DashboardEngine(options);
  const app = (options.app as Express) ?? express();
  const router = Router();
  const basePath = options.basePath ?? "/dashboard";

  router.use(compression());
  router.use(helmet({ contentSecurityPolicy: false }));
  router.use(express.json());
  router.use(
    session({
      secret: options.sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: options.sessionName ?? "discord_dashboard.sid",
    }),
  );

  const buildContext = (req: express.Request): DashboardContext => ({
    user: req.session.discordAuth!.user,
    guilds: req.session.discordAuth!.guilds || [],
    accessToken: req.session.discordAuth!.accessToken || "",
    selectedGuildId: ((req.query as any).guildId as string) || undefined,
    helpers: engine.helpers,
  });

  router.get("/", (req, res) => {
    if (!req.session.discordAuth) return res.redirect(`${basePath}/login`);
    res.type("html").send(engine.render(basePath));
  });

  router.get("/login", (req, res) => {
    const state = randomBytes(16).toString("hex");
    req.session.oauthState = state;
    res.redirect(engine.getAuthUrl(state));
  });

  router.get("/callback", async (req, res) => {
    const { code, state } = req.query;
    if (state !== req.session.oauthState) return res.status(403).send("Invalid OAuth2 state");

    try {
      const tokens = await engine.exchangeCode(code as string);
      const [user, rawGuilds] = await Promise.all([engine.fetchUser(tokens.access_token), engine.fetchGuilds(tokens.access_token)]);

      const ADMIN = 8n;
      const MANAGE_GUILD = 32n;

      const processedGuilds = rawGuilds
        .filter((guild) => {
          const perms = BigInt(guild.permissions || "0");
          return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
        })
        .map((guild) => ({
          ...guild,
          iconUrl: engine.helpers.getGuildIconUrl(guild.id, guild.icon),
          botInGuild: options.client.guilds.cache.has(guild.id),
        }));

      req.session.discordAuth = {
        accessToken: tokens.access_token,
        user: {
          ...user,
          avatarUrl: engine.helpers.getUserAvatarUrl(user.id, user.avatar),
        },
        guilds: processedGuilds,
      };

      res.redirect(basePath);
    } catch (error) {
      console.error("Dashboard Auth Error:", error);
      res.redirect(`${basePath}/login`);
    }
  });

  router.get("/api/session", (req, res) => {
    if (!req.session.discordAuth) return res.json({ authenticated: false });
    res.json({
      authenticated: true,
      user: req.session.discordAuth.user,
      guildCount: req.session.discordAuth.guilds.length,
    });
  });

  router.get("/api/guilds", (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });
    res.json({ guilds: req.session.discordAuth.guilds });
  });

  router.get("/api/overview", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });
    const cards = options.getOverviewCards ? await options.getOverviewCards(buildContext(req)) : [];
    res.json({ cards });
  });

  router.get("/api/home/categories", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });
    const categories = options.home?.getCategories ? await options.home.getCategories(buildContext(req)) : [];
    res.json({ categories });
  });

  router.get("/api/home", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });
    const sections = options.home?.getSections ? await options.home.getSections(buildContext(req)) : [];

    const categoryId = req.query.categoryId as string;
    const filtered = categoryId ? sections.filter((s) => s.categoryId === categoryId) : sections;
    res.json({ sections: filtered });
  });

  router.post("/api/home/:actionId", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });
    const actionId = req.params.actionId;
    const actionFn = options.home?.actions?.[actionId];

    if (!actionFn) return res.status(404).json({ error: "Action not found" });

    try {
      const result = await actionFn(buildContext(req), req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Action failed" });
    }
  });

  router.get("/api/plugins", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });

    const context = buildContext(req);

    const resolvedPlugins = await Promise.all(
      (options.plugins || []).map(async (p) => {
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          panels: p.getPanels ? await p.getPanels(context) : p.panels || [],
        };
      }),
    );

    res.json({ plugins: resolvedPlugins });
  });

  router.post("/api/plugins/:pluginId/:actionId", async (req, res) => {
    if (!req.session.discordAuth) return res.status(401).json({ error: "Unauthorized" });

    const { pluginId, actionId } = req.params;

    const plugin = options.plugins?.find((p) => p.id === pluginId);

    if (!plugin || !plugin.actions?.[actionId]) {
      return res.status(404).json({ error: "Plugin or action not found" });
    }

    try {
      const context = buildContext(req);
      const result = await plugin.actions[actionId](context, req.body);
      res.json(result);
    } catch (error) {
      console.error(`Action Error (${pluginId}/${actionId}):`, error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.use(basePath, router);
  return { app, engine };
}
