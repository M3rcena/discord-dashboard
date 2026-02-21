import type { BotEvent } from "../types";

const event: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(context, interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = context.commands.get(interaction.commandName);
    if (!command) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "Command not found.", ephemeral: true });
      } else {
        await interaction.reply({ content: "Command not found.", ephemeral: true });
      }
      return;
    }

    try {
      if (interaction.guildId) {
        await context.store.update(`command:${interaction.commandName}`, interaction.user.tag, (state) => {
          const current = state.guilds[interaction.guildId!] ?? {
            prefix: "!",
            moderationEnabled: true,
            logChannelId: "",
            welcomeChannelId: "",
            pollButtons: ["✅ Yes", "❌ No"],
            pollMessage: "What should we do for the next event?"
          };

          state.guilds[interaction.guildId!] = {
            ...current,
            lastCommandAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      }

      await command.execute(context, interaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Command execution failed";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `Error: ${message}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `Error: ${message}`, ephemeral: true });
      }
    }
  }
};

export default event;
