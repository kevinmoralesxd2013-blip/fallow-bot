import 'dotenv/config';
import { Client, GatewayIntentBits, Events, EmbedBuilder, Collection } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import db, { followersOf, getSettings } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBOUNCE_MS = 4000;
const buffers = new Map(); // `${follower}:${target}` -> { messages, timer }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) {
  const mod = await import(pathToFileURL(path.join(__dirname, 'commands', file)).href);
  if (mod.data && mod.execute) client.commands.set(mod.data.name, mod);
}

client.once(Events.ClientReady, c => {
  console.log(`Conectado como ${c.user.tag}`);
  c.user.setActivity('mensajes de cuentas seguidas');
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    const payload = { content: 'Error al ejecutar el comando.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
  }
});

client.on(Events.MessageCreate, async msg => {
  if (!msg.inGuild() || msg.author.bot && msg.author.id === client.user.id) return;
  if (!msg.content && msg.attachments.size === 0) return;

  const followers = followersOf.all(msg.author.id);
  if (!followers.length) return;

  const settings = getSettings.get(msg.guildId);
  const useFeed = settings?.feed_channel_id && msg.channelId !== settings.feed_channel_id;

  for (const { follower_id } of followers) {
    if (follower_id === msg.author.id) continue;
    if (useFeed) await pushFeed(msg, settings.feed_channel_id);
    queue(follower_id, msg.author.id, msg);
  }
});

async function pushFeed(msg, channelId) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;
  await channel.send({ embeds: [buildEmbed(msg)] }).catch(() => {});
}

function queue(followerId, targetId, msg) {
  const key = `${followerId}:${targetId}`;
  let b = buffers.get(key);
  if (!b) { b = { messages: [], timer: null }; buffers.set(key, b); }
  b.messages.push(msg);
  clearTimeout(b.timer);
  b.timer = setTimeout(() => flush(key, followerId), DEBOUNCE_MS);
}

async function flush(key, followerId) {
  const b = buffers.get(key);
  buffers.delete(key);
  if (!b) return;

  const user = await client.users.fetch(followerId).catch(() => null);
  if (!user) return;

  const embeds = b.messages.slice(0, 5).map(buildEmbed);
  if (b.messages.length > 5) {
    embeds.push(new EmbedBuilder()
      .setColor(0x99aab5)
      .setDescription(`+${b.messages.length - 5} mensajes más`));
  }

  await user.send({ embeds }).catch(err => {
    console.warn(`No pude enviar MD a ${user.tag}: ${err.code}`);
  });
}

function buildEmbed(msg) {
  const texto = msg.content.length > 300
    ? msg.content.slice(0, 300) + '…'
    : msg.content || (msg.attachments.size ? '(adjunto)' : '');

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
    .setDescription(texto)
    .setFooter({ text: `#${msg.channel.name} · ${msg.guild.name}` })
    .setURL(msg.url)
    .setTimestamp(msg.createdAt);
}

client.login(process.env.DISCORD_TOKEN);
