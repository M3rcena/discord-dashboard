import type { BotConfig } from "./types";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function loadBotConfig(): BotConfig {
  const appPortRaw = process.env.APP_PORT?.trim();
  const appPort = appPortRaw ? Number(appPortRaw) : 3000;

  if (!Number.isFinite(appPort) || appPort <= 0) {
    throw new Error("APP_PORT must be a valid positive number");
  }

  const dashboardBasePath = process.env.DASHBOARD_BASE_PATH?.trim() || "/dashboard";
  const normalizedBasePath = dashboardBasePath.startsWith("/") ? dashboardBasePath : `/${dashboardBasePath}`;

  return {
    appPort,
    dashboardBasePath: normalizedBasePath,
    dashboardName: process.env.DASHBOARD_NAME?.trim() || "Real Bot Dashboard Example",
    botToken: requiredEnv("DISCORD_BOT_TOKEN"),
    clientId: requiredEnv("DISCORD_CLIENT_ID"),
    clientSecret: requiredEnv("DISCORD_CLIENT_SECRET"),
    redirectUri: process.env.DISCORD_REDIRECT_URI?.trim() || `http://localhost:${appPort}${normalizedBasePath}/callback`,
    sessionSecret: requiredEnv("DASHBOARD_SESSION_SECRET"),
    ownerIds: process.env.DASHBOARD_OWNER_IDS
      ? process.env.DASHBOARD_OWNER_IDS.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    devGuildId: process.env.DISCORD_DEV_GUILD_ID?.trim() || undefined
  };
}
