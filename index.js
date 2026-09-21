import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// =========================
// Webサーバー（Render対策）
// =========================
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server起動');
});

// =========================
// Bot作成
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const OWNER_ID = '545988407118135296';

// =========================
// 起動確認
// =========================
client.once('clientReady', async () => {
  console.log(`✅ ログイン: ${client.user.tag}`);

  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send('テストDM');
    console.log('✅ DM送信成功');
  } catch (e) {
    console.log('❌ DM送信失敗', e);
  }
});

// =========================
// VC入退室通知
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('[VC]', oldState.channelId, '→', newState.channelId);

    // 同じチャンネル（ミュート変更など）は無視
    if (oldState.channelId === newState.channelId) return;

    // メンバー取得（undefined対策）
    const member = newState.member || oldState.member;
    const name = member?.displayName || '不明';

    // チャンネル名
    const oldChannel = oldState.channel?.name || '不明';
    const newChannel = newState.channel?.name || '不明';

    // 通知先ユーザー取得
    const user =
      client.users.cache.get(OWNER_ID) ||
      await client.users.fetch(OWNER_ID);

    if (!user) {
      console.log('❌ OWNER取得失敗');
      return;
    }

    // ===== 入室 =====
    if (!oldState.channelId && newState.channelId) {
      console.log('入室イベント');
      await user.send(`🎤 ${name} が「${newChannel}」に参加しました`);
    }

    // ===== 退出 =====
    else if (oldState.channelId && !newState.channelId) {
      console.log('退出イベント');
      await user.send(`🔇 ${name} が「${oldChannel}」から退出しました`);
    }

    // ===== 移動 =====
    else {
      console.log('移動イベント');
      await user.send(`🔁 ${name} が「${oldChannel}」→「${newChannel}」に移動しました`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// =========================
// ログイン
// =========================
client.login(process.env.TOKEN);
