import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

console.log('① 起動開始');

// =========================
// Bot先に作る
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

console.log('② client作成');

// =========================
// ログイン
// =========================
client.once('clientReady', () => {
  console.log(`✅ ログイン成功: ${client.user.tag}`);
});

client.login(process.env.TOKEN)
  .then(() => console.log('③ login処理成功'))
  .catch(err => console.error('❌ login失敗:', err));

console.log('④ login呼び出し完了');

// =========================
// Webサーバー（後にする）
// =========================
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⑤ Web server running on port ${PORT}`);
});
