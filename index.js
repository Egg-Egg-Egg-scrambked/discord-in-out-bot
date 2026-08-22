import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// =========================
// Webサーバー（Render用）
// =========================
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// =========================
// Bot本体
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 🔴 自分のユーザーID
const OWNER_ID = '545988407118135296';

// =========================
// 起動確認
// =========================
console.log('TOKENチェック:', process.env.TOKEN ? 'OK' : 'NG');

// =========================
// ログイン成功ログ
// =========================
client.once('clientReady', () => {
  console.log(`✅ ログイン成功: ${client.user.tag}`);
});

// =========================
// 入退室通知
// =========================
client.on('guildMemberAdd', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📥 ${member.displayName} がサーバーに参加しました`);
  } catch (err) {
    console.error('入室通知エラー:', err);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📤 ${member.displayName} がサーバーから退出しました`);
  } catch (err) {
    console.error('退出通知エラー:', err);
  }
});

// =========================
// VC通知
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('VCイベント発火');

    const user = await client.users.fetch(OWNER_ID);

    // 入室
    if (!oldState.channelId && newState.channelId) {
      await user.send(`🎤 ${newState.member?.displayName} が「${newState.channel?.name}」に参加しました`);
    }

    // 退出
    if (oldState.channelId && !newState.channelId) {
      await user.send(`🔇 ${oldState.member?.displayName} が「${oldState.channel?.name}」から退出しました`);
    }

    // 移動
    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      await user.send(`🔁 ${newState.member?.displayName} が「${oldState.channel?.name}」→「${newState.channel?.name}」に移動しました`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// =========================
// ログイン
// =========================
client.login(process.env.TOKEN)
  .then(() => console.log('Botログイン処理成功'))
  .catch(err => console.error('❌ ログイン失敗:', err));
