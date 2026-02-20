import type { DashboardDiscordHelpers, DiscordChannel, DiscordMember, DiscordRole } from "../Types";

export class DiscordHelpers implements DashboardDiscordHelpers {
  private readonly botToken: string;
  private readonly DISCORD_API = "https://discord.com/api/v10";

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  private async fetchDiscordWithBot<T>(path: string): Promise<T | null> {
    const response = await fetch(`${this.DISCORD_API}${path}`, {
      headers: {
        Authorization: `Bot ${this.botToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  }

  public async getChannel(channelId: string): Promise<DiscordChannel | null> {
    return await this.fetchDiscordWithBot<DiscordChannel>(`/channels/${channelId}`);
  }

  public async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    return (await this.fetchDiscordWithBot<DiscordChannel[]>(`/guilds/${guildId}/channels`)) ?? [];
  }

  public async searchGuildChannels(guildId: string, query: string, options?: { limit?: number; nsfw?: boolean; channelTypes?: number[] }): Promise<DiscordChannel[]> {
    const channels = (await this.fetchDiscordWithBot<DiscordChannel[]>(`/guilds/${guildId}/channels`)) ?? [];
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
  }

  public async getRole(guildId: string, roleId: string): Promise<DiscordRole | null> {
    const roles = await this.fetchDiscordWithBot<DiscordRole[]>(`/guilds/${guildId}/roles`);
    if (!roles) {
      return null;
    }

    return roles.find((role) => role.id === roleId) ?? null;
  }

  public async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    return (await this.fetchDiscordWithBot<DiscordRole[]>(`/guilds/${guildId}/roles`)) ?? [];
  }

  public async searchGuildRoles(guildId: string, query: string, options?: { limit?: number; includeManaged?: boolean }): Promise<DiscordRole[]> {
    const roles = (await this.fetchDiscordWithBot<DiscordRole[]>(`/guilds/${guildId}/roles`)) ?? [];
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
  }

  public async searchGuildMembers(guildId: string, query: string, options?: { limit?: number }): Promise<DiscordMember[]> {
    const limit = Math.max(1, Math.min(options?.limit ?? 10, 1000));
    const params = new URLSearchParams({
      query: query.trim(),
      limit: String(limit),
    });

    return (await this.fetchDiscordWithBot<DiscordMember[]>(`/guilds/${guildId}/members/search?${params.toString()}`)) ?? [];
  }

  public async getGuildMember(guildId: string, userId: string): Promise<DiscordMember | null> {
    return await this.fetchDiscordWithBot<DiscordMember>(`/guilds/${guildId}/members/${userId}`);
  }

  public getGuildIconUrl(guildId: string, iconHash: string | null): string | null {
    if (!iconHash) return null;

    const extension = iconHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${extension}?size=128`;
  }

  public getUserAvatarUrl(userId: string, avatarHash: string | null): string | null {
    if (!avatarHash) return null;
    const extension = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
  }
}
