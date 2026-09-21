import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

console.log('🚀 起動開始');

const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server起動');
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('clientReady', () => {
  console.log(`✅ ログイン成功: ${client.user.tag}`);
});

client.on('error', console.error);

// 🔥 ここ重要
(async () => {
  console.log('🔑 login開始');

  try {
    await client.login(process.env.TOKEN);
    console.log('✅ login成功');
  } catch (err) {
    console.error('❌ ログイン失敗', err);
  }
})();
