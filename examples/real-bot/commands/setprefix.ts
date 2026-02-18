import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("setprefix")
    .setDescription("Set the bot prefix for this guild")
    .addStringOption((option) =>
      option
        .setName("prefix")
        .setDescription("New command prefix")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(5)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(context, interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const prefix = interaction.options.getString("prefix", true).trim();
    await context.store.update("command:setprefix", interaction.user.tag, (state) => {
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
        prefix,
        lastCommandAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    await interaction.reply({ content: `Prefix updated to \`${prefix}\`.`, ephemeral: true });
  }
};

export default command;
