import type { BotEvent } from "../types";

const event: BotEvent<"clientReady"> = {
  name: "clientReady",
  once: true,
  async execute(context, client) {
    const payload = [...context.commands.values()].map((command) => command.data.toJSON());

    if (context.config.devGuildId) {
      const guild = await client.guilds.fetch(context.config.devGuildId);
      await guild.commands.set(payload);
      console.log(`Registered ${payload.length} slash command(s) to dev guild ${guild.name}.`);
    } else {
      await client.application.commands.set(payload);
      console.log(`Registered ${payload.length} global slash command(s).`);
    }

    client.user.setActivity("Dashboard + Slash Commands", { type: 0 });
    console.log(`Bot online as ${client.user.tag}`);
  }
};

export default event;
