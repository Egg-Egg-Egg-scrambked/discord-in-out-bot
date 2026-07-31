import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ユーザーID
const OWNER_ID = '545988407118135296';

client.once('clientReady', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// 入室通知
client.on('guildMemberAdd', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📥 ${member.user.tag} がサーバーに参加しました`);
  } catch (err) {
    console.error('DM送信エラー:', err);
  }
});

// 退出通知
client.on('guildMemberRemove', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📤 ${member.user.tag} がサーバーから退出しました`);
  } catch (err) {
    console.error('DM送信エラー:', err);
  }
});

client.login(process.env.TOKEN);

import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
