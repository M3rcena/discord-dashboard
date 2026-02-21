import { randomBytes } from "crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { DashboardOptions } from "../Types";
import { DashboardEngine } from "../core/DashboardEngine";

export function createFastifyAdapter(fastify: FastifyInstance, options: DashboardOptions) {
  const engine = new DashboardEngine(options);
  const basePath = options.basePath ?? "/dashboard";

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

        const tokens = await engine.exchangeCode(code);
        const [user, guilds] = await Promise.all([engine.fetchUser(tokens.access_token), engine.fetchGuilds(tokens.access_token)]);

        request.session.discordAuth = {
          accessToken: tokens.access_token,
          user,
          guilds,
        };

        return reply.redirect(basePath);
      });
    },
    { prefix: basePath },
  );

  return { engine };
}
