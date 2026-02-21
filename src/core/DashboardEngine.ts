import { DiscordHelpers } from "../handlers/DiscordHelpers";
import { TemplateManager } from "../handlers/TemplateManager";
import type { DashboardGuild, DashboardOptions, DashboardTemplateRenderer, DashboardUser } from "../Types";

export class DashboardEngine {
  public helpers: DiscordHelpers;
  private templateManager: TemplateManager;
  private DISCORD_API = "https://discord.com/api/v10";

  constructor(public options: DashboardOptions) {
    this.helpers = new DiscordHelpers(options.botToken);
    this.templateManager = new TemplateManager(options);
  }

  public getAuthUrl(state: string): string {
    const scope = this.options.scopes && this.options.scopes.length > 0 ? this.options.scopes.join(" ") : ["identify", "guilds"].join(" ");
    const query = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: this.options.redirectUri,
      response_type: "code",
      scope,
      state,
      prompt: "none",
    });
    return `https://discord.com/oauth2/authorize?${query.toString()}`;
  }

  public async exchangeCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const response = await fetch(`${this.DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.options.redirectUri,
      }),
    });

    if (!response.ok) throw new Error(`Failed token exchange: ${response.status} ${await response.text()}`);
    return await response.json();
  }

  public async fetchUser(token: string): Promise<DashboardUser> {
    const res = await fetch(`${this.DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch user: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  public async fetchGuilds(token: string): Promise<DashboardGuild[]> {
    const res = await fetch(`${this.DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch guilds: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  public render(basePath: string): string {
    return this.templateManager.render({
      dashboardName: this.options.dashboardName ?? "Discord Dashboard",
      basePath,
    });
  }
}
