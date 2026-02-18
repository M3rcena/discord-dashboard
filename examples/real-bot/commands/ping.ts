import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check websocket and API latency"),
  async execute(context, interaction) {
    const wsPing = context.client.ws.ping;
    const createdAt = interaction.createdTimestamp;
    const response = await interaction.reply({
      content: "Pinging...",
      fetchReply: true
    });

    const apiLatency = response.createdTimestamp - createdAt;
    await interaction.editReply(`🏓 Pong! WebSocket: ${wsPing}ms | API: ${apiLatency}ms`);
  }
};

export default command;
