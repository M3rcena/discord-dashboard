import type { Elysia } from "elysia";
import type { Express } from "express";
import { DashboardContext, DashboardGuild } from "./discord";
import { DashboardHomeBuilder } from "./home";
import { DashboardPlugin } from "./plugin";
import { DashboardCard, DashboardDesignConfig, DashboardTemplateRenderer } from "./ui";
import { DashboardData } from "./designer";
import { FastifyInstance } from "fastify";
import { BuiltinLayouts } from "../templates";
import { BuiltinThemes } from "../templates/themes";
import type { Client } from "discord.js";

type BuiltinLayoutNames = keyof typeof BuiltinLayouts;
type BuiltinThemeNames = keyof typeof BuiltinThemes;

export interface DashboardOptions {
  app?: Express | Elysia | FastifyInstance;
  port?: number;
  host?: string;
  trustProxy?: boolean | number;
  basePath?: string;
  dashboardName?: string;
  botToken: string;
  client: Client;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
  sessionName?: string;
  sessionMaxAgeMs?: number;
  scopes?: string[];
  botInvitePermissions?: string;
  botInviteScopes?: string[];
  ownerIds?: string[];
  guildFilter?: (guild: DashboardGuild, context: DashboardContext) => Promise<boolean> | boolean;
  getOverviewCards?: (context: DashboardContext) => Promise<DashboardCard[]> | DashboardCard[];
  home?: DashboardHomeBuilder;

  plugins?: DashboardPlugin[];

  uiTemplate?: BuiltinLayoutNames | DashboardTemplateRenderer;
  uiTheme?: BuiltinThemeNames | DashboardDesignConfig;
  setupDesign?: DashboardDesignConfig;
  uiTemplates?: Record<string, DashboardTemplateRenderer>;

  dashboardData?: DashboardData;
}

export interface DashboardInstance {
  app: Express | Elysia | FastifyInstance;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
