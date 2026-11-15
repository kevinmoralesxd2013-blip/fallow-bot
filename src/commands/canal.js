import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { setChannel } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('canal')
  .setDescription('Define el canal donde se publica el feed de seguidos')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(o =>
    o.setName('canal')
      .setDescription('Canal de texto para el feed')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true));

export async function execute(interaction) {
  const canal = interaction.options.getChannel('canal');
  setChannel.run(interaction.guildId, canal.id);
  await interaction.reply({ content: `Feed configurado en ${canal}.`, ephemeral: true });
}
