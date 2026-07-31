import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const OWNER_ID = '545988407118135296';

client.once('ready', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const user = await client.users.fetch(OWNER_ID);
  user.send(`📥 ${member.user.tag} が参加しました`);
});

client.on('guildMemberRemove', async (member) => {
  const user = await client.users.fetch(OWNER_ID);
  user.send(`📤 ${member.user.tag} が退出しました`);
});

client.login('MTUzMjQyNzE3OTU3NTc0MjczNg.Gj2o8k.uFVTA2KVNitxhH22sL0zmsLZw0h6cEkeZagHEA');