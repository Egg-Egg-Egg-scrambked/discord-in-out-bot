import { Client, GatewayIntentBits } from 'discord.js';

// =========================
// Bot作成（←これが先！）
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
// VC通知（←ここに置く）
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('[VC]', oldState.channelId, '→', newState.channelId);

    if (oldState.channelId === newState.channelId) return;

    const member = newState.member || oldState.member;
    const name = member?.displayName || '不明';

    const oldChannel = oldState.channel?.name || '不明';
    const newChannel = newState.channel?.name || '不明';

    const user =
      client.users.cache.get(OWNER_ID) ||
      await client.users.fetch(OWNER_ID);

    if (!user) return console.log('OWNER取得失敗');

    if (!oldState.channelId && newState.channelId) {
      await user.send(`🎤 ${name} が「${newChannel}」に参加`);
    } else if (oldState.channelId && !newState.channelId) {
      await user.send(`🔇 ${name} が「${oldChannel}」から退出`);
    } else {
      await user.send(`🔁 ${name} が「${oldChannel}」→「${newChannel}」に移動`);
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});

// =========================
// 起動確認
// =========================
client.once('ready', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// =========================
// ログイン
// =========================
client.login(process.env.TOKEN);
