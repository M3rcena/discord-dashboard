import jwt from "@elysiajs/jwt";
import node from "@elysiajs/node";
import { Elysia } from "elysia";
import { randomBytes } from "node:crypto";
import { DashboardEngine } from "../core/DashboardEngine";
import { SessionSchema, type DashboardOptions } from "../Types";

export function createElysiaAdapter(options: DashboardOptions) {
  const engine = new DashboardEngine(options);
  const basePath = options.basePath ?? "/dashboard";
  const sessionName = options.sessionName ?? "discord_dashboard.sid";

  const app = (options.app as Elysia) ?? new Elysia({ adapter: node() });

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
      const cookieValue = cookie[sessionName].value as string | undefined;
      if (!cookieValue) return redirect(`${basePath}/login`);

      const sessionData = await sessionSigner.verify(cookieValue);
      if (!sessionData || !sessionData.discordAuth) return redirect(`${basePath}/login`);

      return html(engine.render(basePath));
    })
    .get("/login", async ({ sessionSigner, cookie, redirect }) => {
      const state = randomBytes(16).toString("hex");

      const token = await sessionSigner.sign({ oauthState: state });

      cookie[sessionName].set({
        value: token,
        httpOnly: true,
        path: "/",
      });

      return redirect(engine.getAuthUrl(state));
    })
    .get("/callback", async ({ query, sessionSigner, cookie, redirect }) => {
      const { code, state } = query;
      const cookieValue = cookie[sessionName].value as string | undefined;
      if (!cookieValue) return redirect(`${basePath}/login`);

      const session = await sessionSigner.verify(cookieValue);

      if (!state || !session || state !== session.oauthState) return redirect(`${basePath}/login`);

      const tokens = await engine.exchangeCode(code as string);
      const [user, guilds] = await Promise.all([engine.fetchUser(tokens.access_token), engine.fetchGuilds(tokens.access_token)]);

      const token = await sessionSigner.sign({
        oauthState: undefined,
        discordAuth: {
          accessToken: tokens.access_token,
          user,
          guilds,
        },
      });

      cookie[sessionName].set({
        value: token,
        httpOnly: true,
        path: "/",
      });

      return redirect(basePath);
    });

  app.use(router);

  return { app, engine };
}
