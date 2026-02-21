import "@fastify/session";
import "express-session";
import type { DashboardGuild, DashboardUser } from "./discord";

declare module "fastify" {
  interface Session {
    oauthState?: string;
    discordAuth?: {
      accessToken: string;
      user: DashboardUser;
      guilds: DashboardGuild[];
    };
  }
}

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    discordAuth?: {
      accessToken: string;
      user: DashboardUser;
      guilds: DashboardGuild[];
    };
  }
}
