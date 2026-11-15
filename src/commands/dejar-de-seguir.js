import { SlashCommandBuilder } from 'discord.js';
import { removeFollow } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('dejar-de-seguir')
  .setDescription('Deja de seguir a una cuenta')
  .addUserOption(o =>
    o.setName('cuenta').setDescription('Usuario a dejar de seguir').setRequired(true));

export async function execute(interaction) {
  const target = interaction.options.getUser('cuenta');
  const res = removeFollow.run(interaction.user.id, target.id);

  await interaction.reply({
    content: res.changes
      ? `Dejaste de seguir a **${target.username}**.`
      : `No seguías a **${target.username}**.`,
    ephemeral: true
  });
}
