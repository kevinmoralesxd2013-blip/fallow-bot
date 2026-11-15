import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listFollows } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('siguiendo')
  .setDescription('Muestra a quién sigues');

export async function execute(interaction) {
  const rows = listFollows.all(interaction.user.id);

  if (!rows.length) {
    return interaction.reply({ content: 'Todavía no sigues a nadie. Usa `/seguir`.', ephemeral: true });
  }

  const lines = await Promise.all(rows.map(async r => {
    const u = await interaction.client.users.fetch(r.target_id).catch(() => null);
    return u ? `• ${u.username} (\`${u.id}\`)` : `• \`${r.target_id}\` (no encontrado)`;
  }));

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('Cuentas que sigues')
      .setColor(0x5865f2)
      .setDescription(lines.join('\n'))],
    ephemeral: true
  });
}
