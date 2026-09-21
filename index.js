import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// ===== 起動確認 =====
console.log('起動確認');

// ===== Web =====
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server起動');
});

// ===== Bot =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const CHANNEL_ID = 'ここ入れる';

// ===== ready =====
client.once('clientReady', () => {
  console.log('ログイン成功');
});

// ===== VC通知 =====
client.on('voiceStateUpdate', async (oldState, newState) => {
  console.log('[VC]', oldState.channelId, '→', newState.channelId);

  if (oldState.channelId === newState.channelId) return;

  const member = newState.member || oldState.member;
  const name = member?.displayName || '不明';

  const oldChannel = oldState.channel?.name || '不明';
  const newChannel = newState.channel?.name || '不明';

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log('チャンネル取得失敗');

  if (!oldState.channelId && newState.channelId) {
    await channel.send(`🎤 ${name} が「${newChannel}」に参加`);
  } else if (oldState.channelId && !newState.channelId) {
    await channel.send(`🔇 ${name} が「${oldChannel}」から退出`);
  } else {
    await channel.send(`🔁 ${name} が移動`);
  }
});

// ===== login =====
console.log('login前');

client.login(process.env.TOKEN)
  .then(() => console.log('login通過'))
  .catch(console.error);
