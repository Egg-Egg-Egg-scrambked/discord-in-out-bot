import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// =========================
// Webサーバー（Render用）
// =========================
const app = express();

app.get('/', (req, res) => {
  res.send('OK');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server起動');
});

// =========================
// Bot
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const CHANNEL_ID = 'ここに通知したいチャンネルID'; // ← 自分で入れる

// =========================
// 起動ログ
// =========================
client.once('clientReady', () => {
  console.log(`✅ ログイン: ${client.user.tag}`);
});

// =========================
// VC入退室通知（チャンネル送信版）
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('[VC]', oldState.channelId, '→', newState.channelId);

    if (oldState.channelId === newState.channelId) return;

    const member = newState.member || oldState.member;
    const name = member?.displayName || '不明';

    const oldChannel = oldState.channel?.name || '不明';
    const newChannel = newState.channel?.name || '不明';

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
      console.log('❌ チャンネル取得失敗');
      return;
    }

    // 入室
    if (!oldState.channelId && newState.channelId) {
      await channel.send(`🎤 ${name} が「${newChannel}」に参加しました`);
    }

    // 退出
    else if (oldState.channelId && !newState.channelId) {
      await channel.send(`🔇 ${name} が「${oldChannel}」から退出しました`);
    }

    // 移動
    else {
      await channel.send(`🔁 ${name} が「${oldChannel}」→「${newChannel}」に移動しました`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// =========================
// ログイン（絶対最後）
// =========================
console.log('TOKEN存在:', !!process.env.TOKEN);

client.login(process.env.TOKEN)
  .then(() => console.log('✅ login()通過'))
  .catch(err => console.error('❌ ログイン失敗', err));
