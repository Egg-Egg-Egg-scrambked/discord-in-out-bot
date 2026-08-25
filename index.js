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
// セッション保存
// =========================
const gameSessions = new Map();

// =========================
// スラッシュコマンド登録
// =========================
const commands = [
  new SlashCommandBuilder()
    .setName('rules')
    .setDescription('ワードウルフのルールを表示'),

  new SlashCommandBuilder()
    .setName('wolf')
    .setDescription('VC内でワードウルフを開始'),

  new SlashCommandBuilder()
    .setName('answer')
    .setDescription('人狼を発表する')
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
  } catch {}
});

client.on('guildMemberRemove', async (member) => {
  try {
    const user = await client.users.fetch(OWNER_ID);
    await user.send(`📤 ${member.displayName} がサーバーから退出しました`);
  } catch {}
});

// =========================
// VC通知
// =========================
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    console.log('VCイベント発火');

    const user = await client.users.fetch(OWNER_ID);

    if (!oldState.channelId && newState.channelId) {
      await user.send(`🎤 ${newState.member?.displayName} が「${newState.channel?.name}」に参加しました`);
    }

    if (oldState.channelId && !newState.channelId) {
      await user.send(`🔇 ${oldState.member?.displayName} が「${oldState.channel?.name}」から退出しました`);
    }

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
// コマンド処理
// =========================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // =========================
  // ルール表示
  // =========================
  if (interaction.commandName === 'rules') {
    await interaction.reply({
      content:
`🐺 ワードウルフのルール

・全員にこのBOTから「お題」が配られます
・ただし数人だけ違うお題（人狼）です
・会話しながら、自分のお題を直接言わずにヒントを出します
・最終的に「誰が違うお題か」を当てます
・市民がウルフを当てた場合、ウルフはお題を当てれば逆転勝利

人数ごとの人狼数
3〜5人：1人
6〜9人：2人
10人以上：3人

楽しんでね 😎`
    });
  }

  // =========================
  // ワードウルフ開始
  // =========================
  if (interaction.commandName === 'wolf') {

    await interaction.deferReply();

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply('VC入ってね');
    }

    const IGNORE_IDS = ['917633605684056085'];

    const members = voiceChannel.members
      .filter(m => !m.user.bot && !IGNORE_IDS.includes(m.id))
      .map(m => m);

    if (members.length < 3) {
      return interaction.editReply('3人以上必要！');
    }

    const words = [
      ['りんご', 'みかん'],
      ['カレー', 'シチュー'],
      ['ラーメン', 'うどん'],
      ['寿司', '刺身'],
      ['コーヒー', '紅茶'],
      ['犬', '猫'],
      ['海', 'プール'],
      ['映画', 'ドラマ'],
      ['ゲーム', 'アニメ']
    ];

    const [citizenWord, wolfWord] =
      words[Math.floor(Math.random() * words.length)];

    let wolfCount = 1;
    if (members.length >= 6 && members.length <= 9) wolfCount = 2;
    else if (members.length >= 10) wolfCount = 3;

    const wolfIndexes = [];
    while (wolfIndexes.length < wolfCount) {
      const r = Math.floor(Math.random() * members.length);
      if (!wolfIndexes.includes(r)) wolfIndexes.push(r);
    }

    const guildId = interaction.guild.id;
    gameSessions.set(guildId, {
      wolfIds: wolfIndexes.map(i => members[i].id)
    });

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const isWolf = wolfIndexes.includes(i);
      const word = isWolf ? wolfWord : citizenWord;

      try {
        await m.send(`🐺 ワードウルフ\nあなたのワード: ${word}`);
      } catch {
        console.log(`${m.displayName} DM不可`);
      }
    }

    await interaction.editReply('配布完了！DM見てね');
  }

  // =========================
  // 答え発表
  // =========================
  if (interaction.commandName === 'answer') {

    await interaction.deferReply();

    const guildId = interaction.guild.id;
    const session = gameSessions.get(guildId);

    if (!session) {
      return interaction.editReply('まだゲームやってないよ');
    }

    const names = await Promise.all(
      session.wolfIds.map(async (id) => {
        try {
          const m = await interaction.guild.members.fetch(id);
          return m.displayName;
        } catch {
          return '不明';
        }
      })
    );

    await interaction.editReply(
      `🐺 人狼は...\n👉 ${names.join('、')} でした！`
    );

    gameSessions.delete(guildId);
  }
});

// =========================
// ログイン
// =========================
client.login(TOKEN);
