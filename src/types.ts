import type { Express } from "express";

export type CardIntent = "neutral" | "success" | "warning" | "danger" | "info";

export interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  intent?: CardIntent;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
}

export type DashboardBoxWidth = 100 | 50 | 33 | 20;

export interface DashboardDesignConfig {
  bg?: string;
  rail?: string;
  contentBg?: string;
  panel?: string;
  panel2?: string;
  text?: string;
  muted?: string;
  primary?: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  border?: string;
}

export interface DashboardTemplateRenderContext {
  dashboardName: string;
  basePath: string;
  setupDesign?: DashboardDesignConfig;
}

export type DashboardTemplateRenderer = (context: DashboardTemplateRenderContext) => string;

export interface PluginPanelField {
  id?: string;
  label: string;
  value: string | number | boolean | string[] | Record<string, unknown>;
  type?: HomeFieldType | "url";
  editable?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: HomeFieldOption[];
  lookup?: HomeLookupConfig;
}

export interface PluginPanelAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  collectFields?: boolean;
}

export interface PluginPanel {
  id: string;
  title: string;
  description?: string;
  width?: DashboardBoxWidth;
  fields?: PluginPanelField[];
  actions?: PluginPanelAction[];
}

export interface PluginActionResult {
  ok: boolean;
  message?: string;
  refresh?: boolean;
  data?: unknown;
}

export interface DiscordChannel {
  id: string;
  guild_id?: string;
  name: string;
  type: number;
  parent_id?: string | null;
  nsfw?: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed?: boolean;
  mentionable?: boolean;
  hoist?: boolean;
}

export interface DiscordMember {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  roles: string[];
  nick?: string | null;
  joined_at?: string;
}

export interface DashboardDiscordHelpers {
  getChannel: (channelId: string) => Promise<DiscordChannel | null>;
  getGuildChannels: (guildId: string) => Promise<DiscordChannel[]>;
  searchGuildChannels: (
    guildId: string,
    query: string,
    options?: { limit?: number; nsfw?: boolean; channelTypes?: number[] }
  ) => Promise<DiscordChannel[]>;
  getRole: (guildId: string, roleId: string) => Promise<DiscordRole | null>;
  getGuildRoles: (guildId: string) => Promise<DiscordRole[]>;
  searchGuildRoles: (
    guildId: string,
    query: string,
    options?: { limit?: number; includeManaged?: boolean }
  ) => Promise<DiscordRole[]>;
  searchGuildMembers: (
    guildId: string,
    query: string,
    options?: { limit?: number }
  ) => Promise<DiscordMember[]>;
  getGuildMember: (guildId: string, userId: string) => Promise<DiscordMember | null>;
}

export type DashboardScope = "setup" | "user" | "guild";

export interface HomeCategory {
  id: string;
  label: string;
  scope: DashboardScope;
  description?: string;
}

export type HomeFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "boolean"
  | "role-search"
  | "channel-search"
  | "member-search"
  | "string-list";

export interface HomeLookupConfig {
  limit?: number;
  minQueryLength?: number;
  nsfw?: boolean;
  channelTypes?: number[];
  includeManaged?: boolean;
}

export interface HomeFieldOption {
  label: string;
  value: string;
}

export interface HomeSectionField {
  id: string;
  label: string;
  type: HomeFieldType;
  value?: string | number | boolean | string[] | Record<string, unknown>;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  options?: HomeFieldOption[];
  lookup?: HomeLookupConfig;
}

export interface HomeSectionAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export interface HomeSection {
  id: string;
  title: string;
  description?: string;
  width?: DashboardBoxWidth;
  scope?: DashboardScope;
  categoryId?: string;
  fields?: HomeSectionField[];
  actions?: HomeSectionAction[];
}

export interface HomeActionPayload {
  sectionId: string;
  values: Record<string, unknown>;
}

export interface DashboardHomeBuilder {
  getOverviewSections?: (context: DashboardContext) => Promise<HomeSection[]> | HomeSection[];
  getCategories?: (context: DashboardContext) => Promise<HomeCategory[]> | HomeCategory[];
  getSections?: (context: DashboardContext) => Promise<HomeSection[]> | HomeSection[];
  actions?: Record<
    string,
    (context: DashboardContext, payload: HomeActionPayload) => Promise<PluginActionResult> | PluginActionResult
  >;
}

export interface DashboardUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
}

export interface DashboardGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  iconUrl?: string | null;
  botInGuild?: boolean;
  inviteUrl?: string;
}

export interface DashboardContext {
  user: DashboardUser;
  guilds: DashboardGuild[];
  accessToken: string;
  selectedGuildId?: string;
  helpers: DashboardDiscordHelpers;
}

export interface DashboardPlugin {
  id: string;
  name: string;
  description?: string;
  scope?: DashboardScope | "both";
  getPanels: (context: DashboardContext) => Promise<PluginPanel[]> | PluginPanel[];
  actions?: Record<
    string,
    (context: DashboardContext, body: unknown) => Promise<PluginActionResult> | PluginActionResult
  >;
}

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
