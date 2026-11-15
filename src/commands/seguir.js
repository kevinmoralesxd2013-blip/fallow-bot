import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addFollow } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('seguir')
  .setDescription('Recibe avisos cuando una cuenta escriba')
  .addUserOption(o =>
    o.setName('cuenta').setDescription('Usuario a seguir').setRequired(true));

export async function execute(interaction) {
  const target = interaction.options.getUser('cuenta');

  if (target.id === interaction.user.id) {
    return interaction.reply({ content: 'No puedes seguirte a ti mismo.', ephemeral: true });
  }

  const res = addFollow.run(interaction.user.id, target.id, Date.now());
  if (!res.changes) {
    return interaction.reply({ content: `Ya seguías a **${target.username}**.`, ephemeral: true });
  }

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(`Ahora sigues a **${target.username}**. Te avisaré por MD cuando escriba.`)],
    ephemeral: true
  });
}
