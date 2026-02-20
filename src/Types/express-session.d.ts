import "express-session";
import type { DashboardGuild, DashboardUser } from "./discord";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    discordAuth?: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: number;
      user: DashboardUser;
      guilds: DashboardGuild[];
    };
  }
}
