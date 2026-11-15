import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commands = [];

for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) {
  const mod = await import(pathToFileURL(path.join(__dirname, 'commands', file)).href);
  if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

await rest.put(route, { body: commands });
console.log(`Registrados ${commands.length} comandos.`);
