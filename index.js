import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
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

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // BotのアプリID
const GUILD_ID = process.env.GUILD_ID;   // テスト用サーバーID

// =========================
// スラッシュコマンド登録
// =========================
const commands = [
  new SlashCommandBuilder()
    .setName('wolf')
    .setDescription('VC内でワードウルフを開始する')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('コマンド登録中...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('コマンド登録完了');
  } catch (err) {
    console.error(err);
  }
})();

// =========================
// Bot起動
// =========================
client.once('clientReady', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// =========================
// ワードウルフ処理
// =========================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wolf') {

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    // VC入ってるかチェック
    if (!voiceChannel) {
      return interaction.reply({
        content: 'VCに入ってから使ってね！',
        ephemeral: true
      });
    }

    // VCメンバー取得（Bot除外）
    const members = voiceChannel.members
      .filter(m => !m.user.bot)
      .map(m => m);

    // 人数チェック
    if (members.length < 3) {
      return interaction.reply({
        content: '3人以上必要！',
        ephemeral: true
      });
    }

    // ワードリスト
    const words = [
      ['りんご', 'みかん'],
      ['犬', '猫'],
      ['海', 'プール'],
      ['カレー', 'シチュー'],
      ['電車', 'バス']
    ];

    // ランダム選択
    const [citizenWord, wolfWord] =
      words[Math.floor(Math.random() * words.length)];

    // 人狼決定
    const wolfIndex = Math.floor(Math.random() * members.length);

    // DM送信
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const word = i === wolfIndex ? wolfWord : citizenWord;

      try {
        await m.send(`🐺 ワードウルフ\nあなたのお題は「${word}」です`);
      } catch (err) {
        console.log(`${m.displayName} にDM送れなかった`);
      }
    }

    // 実行者にだけ通知
    await interaction.reply({
      content: 'ワードを配布しました！DMを確認してね',
      ephemeral: true
    });
  }
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('wolf')
    .setDescription('VC内でワードウルフを開始')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('コマンド登録中...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('登録完了');
  } catch (err) {
    console.error(err);
  }
})();

// TOKEN
client.login(process.env.TOKEN);
