import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Show server details and saved settings"),
  async execute(context, interaction) {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const settings = await context.store.getGuildState(interaction.guildId);
    const embed = {
      title: `${interaction.guild.name} • Overview`,
      color: 0x5865f2,
      fields: [
        { name: "Members", value: String(interaction.guild.memberCount ?? 0), inline: true },
        { name: "Prefix", value: settings.prefix, inline: true },
        { name: "Moderation", value: settings.moderationEnabled ? "Enabled" : "Disabled", inline: true },
        { name: "Welcome Channel", value: settings.welcomeChannelId || "Not configured", inline: false },
        { name: "Log Channel", value: settings.logChannelId || "Not configured", inline: false }
      ],
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};

export default command;
