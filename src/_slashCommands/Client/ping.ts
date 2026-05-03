import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { performance } from 'perf_hooks';
import { SlashCommandHandler } from '../../../types/index.js';

export default {
  status: true,
  metadata: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping pong Command with latency measurement.')
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ]),
  run: async function (interaction) {
    const now = performance.now();
    await interaction.SendOrEdit('Pinging...', true);
    const latency = performance.now() - now;
    await interaction.SendOrEdit(`Pong! Latency: ${latency.toFixed(2)}ms`);
  },
} as SlashCommandHandler;
