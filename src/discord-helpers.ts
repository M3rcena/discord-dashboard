import type {
  DashboardDiscordHelpers,
  DiscordChannel,
  DiscordMember,
  DiscordRole
} from "./types";

const DISCORD_API = "https://discord.com/api/v10";

async function fetchDiscordWithBot<T>(botToken: string, path: string): Promise<T | null> {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: {
      Authorization: `Bot ${botToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export function createDiscordHelpers(botToken: string): DashboardDiscordHelpers {
  return {
    async getChannel(channelId: string): Promise<DiscordChannel | null> {
      return await fetchDiscordWithBot<DiscordChannel>(botToken, `/channels/${channelId}`);
    },

    async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
      return (await fetchDiscordWithBot<DiscordChannel[]>(botToken, `/guilds/${guildId}/channels`)) ?? [];
    },

    async searchGuildChannels(
      guildId: string,
      query: string,
      options?: { limit?: number; nsfw?: boolean; channelTypes?: number[] }
    ): Promise<DiscordChannel[]> {
      const channels = (await fetchDiscordWithBot<DiscordChannel[]>(botToken, `/guilds/${guildId}/channels`)) ?? [];
      const normalizedQuery = query.trim().toLowerCase();
      const limit = Math.max(1, Math.min(options?.limit ?? 10, 50));

      return channels
        .filter((channel) => {
          if (options?.nsfw !== undefined && Boolean(channel.nsfw) !== options.nsfw) {
            return false;
          }

          if (options?.channelTypes && options.channelTypes.length > 0 && !options.channelTypes.includes(channel.type)) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return channel.name.toLowerCase().includes(normalizedQuery);
        })
        .slice(0, limit);
    },

    async getRole(guildId: string, roleId: string): Promise<DiscordRole | null> {
      const roles = await fetchDiscordWithBot<DiscordRole[]>(botToken, `/guilds/${guildId}/roles`);
      if (!roles) {
        return null;
      }

      return roles.find((role) => role.id === roleId) ?? null;
    },

    async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
      return (await fetchDiscordWithBot<DiscordRole[]>(botToken, `/guilds/${guildId}/roles`)) ?? [];
    },

    async searchGuildRoles(
      guildId: string,
      query: string,
      options?: { limit?: number; includeManaged?: boolean }
    ): Promise<DiscordRole[]> {
      const roles = (await fetchDiscordWithBot<DiscordRole[]>(botToken, `/guilds/${guildId}/roles`)) ?? [];
      const normalizedQuery = query.trim().toLowerCase();
      const limit = Math.max(1, Math.min(options?.limit ?? 10, 50));

      return roles
        .filter((role) => {
          if (!options?.includeManaged && role.managed) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return role.name.toLowerCase().includes(normalizedQuery);
        })
        .sort((a, b) => b.position - a.position)
        .slice(0, limit);
    },

    async searchGuildMembers(
      guildId: string,
      query: string,
      options?: { limit?: number }
    ): Promise<DiscordMember[]> {
      const limit = Math.max(1, Math.min(options?.limit ?? 10, 1000));
      const params = new URLSearchParams({
        query: query.trim(),
        limit: String(limit)
      });

      return (await fetchDiscordWithBot<DiscordMember[]>(botToken, `/guilds/${guildId}/members/search?${params.toString()}`)) ?? [];
    },

    async getGuildMember(guildId: string, userId: string): Promise<DiscordMember | null> {
      return await fetchDiscordWithBot<DiscordMember>(botToken, `/guilds/${guildId}/members/${userId}`);
    }
  };
}
