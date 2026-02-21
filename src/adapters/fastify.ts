import { randomBytes } from "crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { DashboardContext, DashboardOptions, HomeActionPayload } from "../Types";
import { DashboardEngine } from "../core/DashboardEngine";

export function createFastifyAdapter(fastify: FastifyInstance, options: DashboardOptions) {
  const engine = new DashboardEngine(options);
  const basePath = options.basePath ?? "/dashboard";

  const buildContext = (request: FastifyRequest): DashboardContext => {
    const query = request.query as Record<string, unknown>;

    return {
      user: request.session.discordAuth!.user,
      guilds: request.session.discordAuth!.guilds || [],
      accessToken: request.session.discordAuth!.accessToken || "",
      selectedGuildId: typeof query.guildId === "string" ? query.guildId : undefined,
      helpers: engine.helpers,
    };
  };

  fastify.register(
    async (instance) => {
      instance.get("/", async (request, reply) => {
        if (!request.session.discordAuth) return reply.redirect(`${basePath}/login`);
        return reply.type("html").send(engine.render(basePath));
      });

      instance.get("/login", async (request, reply) => {
        const state = randomBytes(16).toString("hex");
        request.session.oauthState = state;
        return reply.redirect(engine.getAuthUrl(state));
      });

      instance.get("/callback", async (request: FastifyRequest<{ Querystring: { code: string; state: string } }>, reply) => {
        const { code, state } = request.query;
        if (state !== request.session.oauthState) return reply.status(403).send("Invalid OAuth2 state");

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
              ...guild,
              iconUrl: engine.helpers.getGuildIconUrl(guild.id, guild.icon),
              botInGuild: options.client.guilds.cache.has(guild.id),
            }));

          request.session.discordAuth = {
            accessToken: tokens.access_token,
            user: {
              ...user,
              avatarUrl: engine.helpers.getUserAvatarUrl(user.id, user.avatar),
            },
            guilds: processedGuilds,
          };

          return reply.redirect(basePath);
        } catch (error) {
          console.error("Dashboard Auth Error:", error);
          return reply.redirect(`${basePath}/login`);
        }
      });

      instance.get("/api/session", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.send({ authenticated: false });
        }

        return reply.send({
          authenticated: true,
          user: request.session.discordAuth.user,
          guildCount: request.session.discordAuth.guilds.length,
        });
      });

      instance.get("/api/guilds", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        return reply.send({ guilds: request.session.discordAuth.guilds });
      });

      instance.get("/api/overview", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const cards = options.getOverviewCards ? await options.getOverviewCards(buildContext(request)) : [];
        return reply.send({ cards });
      });

      instance.get("/api/home/categories", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const categories = options.home?.getCategories ? await options.home.getCategories(buildContext(request)) : [];
        return reply.send({ categories });
      });

      instance.get("/api/home", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const sections = options.home?.getSections ? await options.home.getSections(buildContext(request)) : [];
        const query = request.query as Record<string, unknown>;
        const categoryId = typeof query.categoryId === "string" ? query.categoryId : undefined;
        const filteredSections = categoryId ? sections.filter((section) => section.categoryId === categoryId) : sections;

        return reply.send({ sections: filteredSections });
      });

      instance.post("/api/home/:actionId", async (request: FastifyRequest<{ Params: { actionId: string }; Body: unknown }>, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const actionFn = options.home?.actions?.[request.params.actionId];
        if (!actionFn) {
          return reply.status(404).send({ error: "Action not found" });
        }

        try {
          const result = await actionFn(buildContext(request), request.body as HomeActionPayload);
          return reply.send(result);
        } catch (error) {
          return reply.status(500).send({ error: error instanceof Error ? error.message : "Action failed" });
        }
      });

      instance.get("/api/plugins", async (request, reply) => {
        if (!request.session.discordAuth) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const context = buildContext(request);
        const resolvedPlugins = await Promise.all(
          (options.plugins || []).map(async (plugin) => ({
            id: plugin.id,
            name: plugin.name,
            description: plugin.description,
            panels: plugin.getPanels ? await plugin.getPanels(context) : plugin.panels || [],
          })),
        );

        return reply.send({ plugins: resolvedPlugins });
      });

      instance.post(
        "/api/plugins/:pluginId/:actionId",
        async (request: FastifyRequest<{ Params: { pluginId: string; actionId: string }; Body: unknown }>, reply) => {
          if (!request.session.discordAuth) {
            return reply.status(401).send({ error: "Unauthorized" });
          }

          const { pluginId, actionId } = request.params;
          const plugin = options.plugins?.find((item) => item.id === pluginId);

          if (!plugin || !plugin.actions?.[actionId]) {
            return reply.status(404).send({ error: "Plugin or action not found" });
          }

          try {
            const result = await plugin.actions[actionId](buildContext(request), request.body as Record<string, unknown>);
            return reply.send(result);
          } catch (error) {
            console.error(`Action Error (${pluginId}/${actionId}):`, error);
            return reply.status(500).send({ error: "Internal Server Error" });
          }
        },
      );
    },
    { prefix: basePath },
  );

  return { engine };
}
