import type { Express } from "express";
import { DashboardDesignConfig, DashboardTemplateRenderer, DashboardCard } from "./ui";
import { DashboardContext, DashboardGuild } from "./discord";
import { DashboardHomeBuilder } from "./home";
import { DashboardPlugin } from "./plugin";

export interface DashboardOptions {
  app?: Express;
  port?: number;
  host?: string;
  trustProxy?: boolean | number;
  basePath?: string;
  dashboardName?: string;
  setupDesign?: DashboardDesignConfig;
  uiTemplate?: string;
  uiTemplates?: Record<string, DashboardTemplateRenderer>;
  botToken: string;
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
}

export interface DashboardInstance {
  app: Express;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
