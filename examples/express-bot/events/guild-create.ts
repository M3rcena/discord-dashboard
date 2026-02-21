import type { BotEvent } from "../types";

const event: BotEvent<"guildCreate"> = {
  name: "guildCreate",
  async execute(context, guild) {
    await context.store.update("event:guildCreate", guild.name, (state) => {
      const current = state.guilds[guild.id] ?? {
        prefix: "!",
        moderationEnabled: true,
        logChannelId: "",
        welcomeChannelId: "",
        pollButtons: ["✅ Yes", "❌ No"],
        pollMessage: "What should we do for the next event?"
      };

      state.guilds[guild.id] = {
        ...current,
        lastEvent: "guildCreate",
        lastEventAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    console.log(`Joined guild: ${guild.name} (${guild.id})`);
  }
};

export default event;
