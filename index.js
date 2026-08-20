import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
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
// 環境変数
// =========================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// =========================
// スラッシュコマンド登録
// =========================
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

// =========================
// 起動ログ
// =========================
client.once('clientReady', () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// =========================
// 入退室通知
// =========================
client.on('guildMemberAdd', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📥 ${member.displayName} がサーバーに参加しました`);
  } catch (err) {
    console.error(err);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📤 ${member.displayName} がサーバーから退出しました`);
  } catch (err) {
    console.error(err);
  }
});

// =========================
// VC通知
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const user = await client.users.fetch(OWNER_ID);

    if (!oldState.channelId && newState.channelId) {
      await user.send(`🎤 ${newState.member.displayName} が「${newState.channel?.name}」に参加しました`);
    }

    if (oldState.channelId && !newState.channelId) {
      await user.send(`🔇 ${oldState.member.displayName} が「${oldState.channel?.name}」から退出しました`);
    }

    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      await user.send(`🔁 ${newState.member.displayName} が「${oldState.channel?.name}」→「${newState.channel?.name}」に移動しました`);
    }

  } catch (err) {
    console.error(err);
  }
});

// =========================
// ワードウルフ
// =========================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wolf') {

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: 'VC入ってね', ephemeral: true });
    }

    const members = voiceChannel.members
      .filter(m => !m.user.bot)
      .map(m => m);

    if (members.length < 3) {
      return interaction.reply({ content: '3人以上必要！', ephemeral: true });
    }

    const words = [
      ['りんご', 'みかん'],
      ['犬', '猫'],
      ['海', 'プール'],
      ['カレー', 'シチュー']
    ];

    const [citizenWord, wolfWord] =
      words[Math.floor(Math.random() * words.length)];

    const wolfIndex = Math.floor(Math.random() * members.length);

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const word = i === wolfIndex ? wolfWord : citizenWord;

      try {
        await m.send(`🐺 あなたのワード: ${word}`);
      } catch {
        console.log(`${m.displayName} DM不可`);
      }
    }

    await interaction.reply({
      content: '配布完了！DM見てね',
      ephemeral: true
    });
  }
});

// =========================
// ログイン
// =========================
client.login(TOKEN);
