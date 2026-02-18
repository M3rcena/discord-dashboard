import type { BotEvent } from "../types";

const event: BotEvent<"guildDelete"> = {
  name: "guildDelete",
  async execute(context, guild) {
    await context.store.update("event:guildDelete", guild.id, (state) => {
      const current = state.guilds[guild.id];
      if (!current) {
        return;
      }

      state.guilds[guild.id] = {
        ...current,
        lastEvent: "guildDelete",
        lastEventAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    console.log(`Removed from guild: ${guild.name ?? "Unknown"} (${guild.id})`);
  }
};

export default event;
