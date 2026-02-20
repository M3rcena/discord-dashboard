export interface DashboardUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
  avatarUrl?: string | null;
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
  searchGuildChannels: (guildId: string, query: string, options?: { limit?: number; nsfw?: boolean; channelTypes?: number[] }) => Promise<DiscordChannel[]>;
  getRole: (guildId: string, roleId: string) => Promise<DiscordRole | null>;
  getGuildRoles: (guildId: string) => Promise<DiscordRole[]>;
  searchGuildRoles: (guildId: string, query: string, options?: { limit?: number; includeManaged?: boolean }) => Promise<DiscordRole[]>;
  searchGuildMembers: (guildId: string, query: string, options?: { limit?: number }) => Promise<DiscordMember[]>;
  getGuildMember: (guildId: string, userId: string) => Promise<DiscordMember | null>;
}

export interface DashboardContext {
  user: DashboardUser;
  guilds: DashboardGuild[];
  accessToken: string;
  selectedGuildId?: string;
  helpers: DashboardDiscordHelpers;
}
