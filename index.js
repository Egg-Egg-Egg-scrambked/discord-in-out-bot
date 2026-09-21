import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// =========================
// 起動ログ
// =========================
console.log('🚀 起動開始');

// =========================
// Webサーバー（Render対策）
// =========================
const app = express();

app.get('/', (req, res) => {
  res.send('OK');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server起動');
});

// =========================
// Bot作成（Intentしっかり入れる）
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,       // ←重要
    GatewayIntentBits.GuildVoiceStates    // ←VC用
  ]
});

// =========================
// 設定
// =========================
const CHANNEL_ID = 'ここにチャンネルID入れる';

// =========================
// 接続ログ
// =========================
client.once('clientReady', () => {
  console.log(`✅ ログイン成功: ${client.user.tag}`);
});

// デバッグ（接続トラブル用）
client.on('error', console.error);
client.on('shardError', console.error);
client.on('disconnect', () => console.log('⚠️ 切断された'));
client.on('reconnecting', () => console.log('🔄 再接続中'));

// =========================
// VC入退室通知
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('[VC]', oldState.channelId, '→', newState.channelId);

    // 同じチャンネルなら無視（ミュート等）
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
      console.log('入室イベント');
      await channel.send(`🎤 ${name} が「${newChannel}」に参加しました`);
    }

    // 退出
    else if (oldState.channelId && !newState.channelId) {
      console.log('退出イベント');
      await channel.send(`🔇 ${name} が「${oldChannel}」から退出しました`);
    }

    // 移動
    else {
      console.log('移動イベント');
      await channel.send(`🔁 ${name} が「${oldChannel}」→「${newChannel}」に移動しました`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// =========================
// ログイン（必ず一番最後）
// =========================
console.log('🔑 login前');

client.login(process.env.TOKEN)
  .then(() => console.log('✅ login()通過'))
  .catch(err => console.error('❌ ログイン失敗', err));
