import type {
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import type { DemoStateStore } from "./state-store";

export interface BotConfig {
  appPort: number;
  dashboardBasePath: string;
  dashboardName: string;
  botToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
  ownerIds: string[];
  devGuildId?: string;
}

export interface BotRuntimeContext {
  client: Client;
  commands: Map<string, BotCommand>;
  store: DemoStateStore;
  config: BotConfig;
  startedAt: number;
}

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface BotCommand {
  data: SlashCommandData;
  execute: (context: BotRuntimeContext, interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (context: BotRuntimeContext, ...args: ClientEvents[K]) => Promise<void> | void;
}
