import jwt from "@elysiajs/jwt";
import node from "@elysiajs/node";
import { Elysia } from "elysia";
import { randomBytes } from "node:crypto";
import { DashboardEngine } from "../core/DashboardEngine";
import { SessionSchema, type DashboardContext, type DashboardOptions, type HomeActionPayload, type SessionData } from "../Types";

export function createElysiaAdapter(options: DashboardOptions) {
  const engine = new DashboardEngine(options);
  const basePath = options.basePath ?? "/dashboard";
  const sessionName = options.sessionName ?? "discord_dashboard.sid";

  const app = (options.app as Elysia) ?? new Elysia({ adapter: node() });

  const getSession = async (sessionSigner: any, cookie: any): Promise<SessionData | null> => {
    const cookieValue = cookie[sessionName]?.value as string | undefined;
    if (!cookieValue) return null;
    const session = await sessionSigner.verify(cookieValue);
    return session ?? null;
  };

  const setSession = async (sessionSigner: any, cookie: any, session: SessionData): Promise<void> => {
    const token = await sessionSigner.sign(session);
    cookie[sessionName].set({
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  };

  const buildContext = (session: SessionData, query?: Record<string, unknown>): DashboardContext => ({
    user: session.discordAuth!.user,
    guilds: (session.discordAuth!.guilds || []).map((guild) => ({
      ...guild,
      botInGuild: guild.botInGuild ?? undefined,
      inviteUrl: guild.inviteUrl ?? undefined,
    })),
    accessToken: session.discordAuth!.accessToken || "",
    selectedGuildId: typeof query?.guildId === "string" ? query.guildId : undefined,
    helpers: engine.helpers,
  });

  const router = new Elysia({ prefix: basePath })
    .use(
      jwt({
        name: "sessionSigner",
        secret: options.sessionSecret,
        schema: SessionSchema,
      }),
    )
    .derive(({ set }) => ({
      html: (content: string) => {
        set.headers["Content-Type"] = "text/html; charset=utf8";
        return content;
      },
    }))
    .get("/", async ({ sessionSigner, cookie, redirect, html }) => {
      const sessionData = await getSession(sessionSigner, cookie);
      if (!sessionData || !sessionData.discordAuth) return redirect(`${basePath}/login`);

      return html(engine.render(basePath));
    })
    .get("/login", async ({ sessionSigner, cookie, redirect }) => {
      const state = randomBytes(16).toString("hex");

      await setSession(sessionSigner, cookie, { oauthState: state });

      return redirect(engine.getAuthUrl(state));
    })
    .get("/callback", async ({ query, sessionSigner, cookie, redirect }) => {
      const { code, state } = query as { code?: string; state?: string; error?: string };
      const session = await getSession(sessionSigner, cookie);

      if (!code || !state || !session || state !== session.oauthState) return redirect(`${basePath}/login`);

      try {
        const tokens = await engine.exchangeCode(code);
        const [user, rawGuilds] = await Promise.all([engine.fetchUser(tokens.access_token), engine.fetchGuilds(tokens.access_token)]);

        const ADMIN = 8n;
        const MANAGE_GUILD = 32n;

        const processedGuilds = rawGuilds
          .filter((guild) => {
            const perms = BigInt(guild.permissions || "0");
            return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
          })
          .map((guild) => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            owner: guild.owner,
            permissions: guild.permissions,
            iconUrl: engine.helpers.getGuildIconUrl(guild.id, guild.icon),
            botInGuild: options.client.guilds.cache.has(guild.id),
          }));

        await setSession(sessionSigner, cookie, {
          discordAuth: {
            accessToken: tokens.access_token,
            user: {
              id: user.id,
              username: user.username,
              discriminator: user.discriminator,
              avatar: user.avatar,
              global_name: user.global_name,
              avatarUrl: engine.helpers.getUserAvatarUrl(user.id, user.avatar),
            },
            guilds: processedGuilds,
          },
        });

        return redirect(basePath);
      } catch (error) {
        console.error("Dashboard Auth Error:", error);
        return redirect(`${basePath}/login`);
      }
    })
    .get("/api/session", async ({ sessionSigner, cookie }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) return { authenticated: false };

      return {
        authenticated: true,
        user: session.discordAuth.user,
        guildCount: session.discordAuth.guilds.length,
      };
    })
    .get("/api/guilds", async ({ sessionSigner, cookie, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      return { guilds: session.discordAuth.guilds };
    })
    .get("/api/overview", async ({ sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const cards = options.getOverviewCards ? await options.getOverviewCards(buildContext(session, query as Record<string, unknown>)) : [];
      return { cards };
    })
    .get("/api/home/categories", async ({ sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const categories = options.home?.getCategories ? await options.home.getCategories(buildContext(session, query as Record<string, unknown>)) : [];
      return { categories };
    })
    .get("/api/home", async ({ sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const context = buildContext(session, query as Record<string, unknown>);
      const sections = options.home?.getSections ? await options.home.getSections(context) : [];
      const categoryId = typeof (query as Record<string, unknown>).categoryId === "string"
        ? ((query as Record<string, unknown>).categoryId as string)
        : undefined;
      const filteredSections = categoryId ? sections.filter((section) => section.categoryId === categoryId) : sections;

      return { sections: filteredSections };
    })
    .post("/api/home/:actionId", async ({ params, body, sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const actionFn = options.home?.actions?.[params.actionId];
      if (!actionFn) {
        set.status = 404;
        return { error: "Action not found" };
      }

      try {
        return await actionFn(buildContext(session, query as Record<string, unknown>), body as HomeActionPayload);
      } catch (error) {
        set.status = 500;
        return { error: error instanceof Error ? error.message : "Action failed" };
      }
    })
    .get("/api/plugins", async ({ sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const context = buildContext(session, query as Record<string, unknown>);
      const resolvedPlugins = await Promise.all(
        (options.plugins || []).map(async (plugin) => ({
          id: plugin.id,
          name: plugin.name,
          description: plugin.description,
          panels: plugin.getPanels ? await plugin.getPanels(context) : plugin.panels || [],
        })),
      );

      return { plugins: resolvedPlugins };
    })
    .post("/api/plugins/:pluginId/:actionId", async ({ params, body, sessionSigner, cookie, query, set }) => {
      const session = await getSession(sessionSigner, cookie);
      if (!session?.discordAuth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const plugin = options.plugins?.find((item) => item.id === params.pluginId);
      if (!plugin || !plugin.actions?.[params.actionId]) {
        set.status = 404;
        return { error: "Plugin or action not found" };
      }

      try {
        return await plugin.actions[params.actionId](buildContext(session, query as Record<string, unknown>), body);
      } catch (error) {
        console.error(`Action Error (${params.pluginId}/${params.actionId}):`, error);
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    });

  app.use(router);

  return { app, engine };
}
