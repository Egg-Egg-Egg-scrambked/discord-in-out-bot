import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// （Render用）
const app = express();
app.get('/', (req, res) => {
  res.send('Bot is running');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 🔴 自分のユーザーID
const OWNER_ID = '545988407118135296';

client.once('clientReady', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// ===== 入退室通知 =====

// 入室
client.on('guildMemberAdd', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📥 ${member.displayName} がサーバーに参加しました`);
  } catch (err) {
    console.error('入室通知エラー:', err);
  }
});

// 退出
client.on('guildMemberRemove', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📤 ${member.displayName} がサーバーから退出しました`);
  } catch (err) {
    console.error('退出通知エラー:', err);
  }
});

// ===== VC通知 =====

client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const user = await client.users.fetch(OWNER_ID);

    // 入室
    if (!oldState.channelId && newState.channelId) {
      const channelName = newState.channel?.name ?? '不明なチャンネル';
      await user.send(`🎤 ${newState.member.displayName} が「${channelName}」に参加しました`);
    }

    // 退出
    if (oldState.channelId && !newState.channelId) {
      const channelName = oldState.channel?.name ?? '不明なチャンネル';
      await user.send(`🔇 ${oldState.member.displayName} が「${channelName}」から退出しました`);
    }

    // 移動
    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      const oldName = oldState.channel?.name ?? '不明';
      const newName = newState.channel?.name ?? '不明';
      await user.send(`🔁 ${newState.member.displayName} が「${oldName}」→「${newName}」に移動しました`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// TOKEN
client.login(process.env.TOKEN);
