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
    const user = await client.users.fetch(OWNER_ID);

    if (!oldState.channelId && newState.channelId) {
      await user.send(`🎤 ${newState.member.displayName} が「${newState.channel?.name}」に参加しました`);
    }

    if (oldState.channelId && !newState.channelId) {
      await user.send(`🔇 ${oldState.member.displayName} が「${oldState.channel?.name}」から退出しました`);
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      await user.send(`🔁 ${newState.member.displayName} が「${oldState.channel?.name}」→「${newState.channel?.name}」に移動しました`);
    }

  } catch {}
});

// =========================
// コマンド処理
// =========================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // =========================
  // ワードウルフ開始
  // =========================
  if (interaction.commandName === 'rules') {

  await interaction.reply({
    content:
`🐺 ワードウルフのルール

・全員にこのBOTから「お題」が配られます
・ただし数人だけ違うお題（人狼）です
・会話しながら、自分のお題を直接言わずにヒントを出します
・最終的に「誰が違うお題か」を当てます
・市民がウルフを当てることができた場合
　ウルフは市民のワードを言い当てれば逆転勝利

人狼の人数は参加人数によって変わるよ！
3人－5人　ウルフ1人
6人－9人　ウルフ2人
10人以上　ウルフ3人

楽しんでね 😎`,
  });

}
  if (interaction.commandName === 'wolf') {
　await interaction.deferReply();
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: 'VC入ってね', ephemeral: true });
    }

  const IGNORE_IDS = [
    '917633605684056085'
  ];
  
  const members = voiceChannel.members
    .filter(m => 
      !m.user.bot &&
      !IGNORE_IDS.includes(m.id)
    )
    .map(m => m);

    if (members.length < 3) {
      return interaction.reply({ content: '3人以上必要！', ephemeral: true });
    }

const words = [
  ['りんご', 'みかん'],
  ['カレー', 'シチュー'],
  ['ラーメン', 'うどん'],
  ['そば', 'パスタ'],
  ['寿司', '刺身'],
  ['焼肉', 'ステーキ'],
  ['ハンバーガー', 'ホットドッグ'],
  ['ピザ', 'お好み焼き'],
  ['ケーキ', 'アイス'],
  ['チョコ', 'クッキー'],
  ['コーヒー', '紅茶'],
  ['ジュース', 'お茶'],
  ['牛乳', '豆乳'],
  ['ビール', 'ワイン'],
  ['スマホ', 'タブレット'],
  ['テレビ', 'YouTube'],
  ['LINE', 'Discord'],
  ['財布', 'カバン'],
  ['時計', 'スマートウォッチ'],
  ['ベッド', '布団'],
  ['シャワー', 'お風呂'],
  ['車', 'バイク'],
  ['電車', 'バス'],
  ['飛行機', '新幹線'],
  ['自転車', 'キックボード'],
  ['タクシー', '電車'],
  ['海', 'プール'],
  ['山', '川'],
  ['学校', '会社'],
  ['コンビニ', 'スーパー'],
  ['デパート', 'ショッピングモール'],
  ['ホテル', '旅館'],
  ['空港', '駅'],
  ['温泉', 'サウナ'],
  ['先生', '生徒'],
  ['警察', '消防士'],
  ['医者', '看護師'],
  ['社長', '社員'],
  ['太陽', '月'],
  ['雨', '雪'],
  ['砂漠', 'ジャングル'],
  ['春', '秋'],
  ['夏', '冬'],
  ['映画', 'ドラマ'],
  ['ゲーム', 'アニメ'],
  ['漫画', '小説'],
  ['野球', 'サッカー'],
  ['テニス', 'バドミントン'],
  ['カラオケ', 'ライブ'],
  ['旅行', '出張'],
  ['ボールペン', 'シャーペン'],
  ['ノート', '教科書'],
  ['黒板', 'ホワイトボード'],
  ['剣', '銃'],
  ['魔法', '科学'],
  ['忍者', '侍'],
  ['ドラゴン', '恐竜'],
  ['天使', '悪魔'],
  ['幽霊', 'ゾンビ'],
  ['ヒーロー', 'ヴィラン'],
  ['自由', '平和'],
  ['夢', '現実'],
  ['過去', '未来'],
  ['運命', '偶然'],
  ['愛', '友情'],
  ['猫カフェ', 'ドッグカフェ'],
  ['陰キャ', '陽キャ'],
  ['ニート', '社畜'],
  ['ガチャ', '課金'],
  ['FPS', 'RPG'],
  ['配信者', '視聴者']
];

    const [citizenWord, wolfWord] =
      words[Math.floor(Math.random() * words.length)];

    // 人狼人数
    let wolfCount = 1;
    if (members.length >= 6 && members.length <= 9) wolfCount = 2;
    else if (members.length >= 10) wolfCount = 3;

    // 人狼選出
    const wolfIndexes = [];
    while (wolfIndexes.length < wolfCount) {
      const r = Math.floor(Math.random() * members.length);
      if (!wolfIndexes.includes(r)) wolfIndexes.push(r);
    }

    // 保存（これが超重要）
    const guildId = interaction.guild.id;
    gameSessions.set(guildId, {
      wolfIds: wolfIndexes.map(i => members[i].id)
    });

    // 配布
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const isWolf = wolfIndexes.includes(i);
      const word = isWolf ? wolfWord : citizenWord;

      try {
      await m.send(
        `🐺 ワードウルフ\nあなたのワード: ${word}`
      );
      } catch {
        console.log(`${m.displayName} DM不可`);
      }
    }

await interaction.editReply({
  content: '配布完了！DM見てね'
});
  }

  // =========================
  // 答え発表
  // =========================
  if (interaction.commandName === 'answer') {
　　await interaction.deferReply();
    const guildId = interaction.guild.id;
    const session = gameSessions.get(guildId);

    if (!session) {
      return interaction.reply({
        content: 'まだゲームやってないよ',
        ephemeral: true
      });
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

await interaction.editReply({
  content: `🐺 人狼は...\n👉 ${names.join('、')} でした！`
});

    // リセット
    gameSessions.delete(guildId);
  }
});

// =========================
// ログイン
// =========================
client.login(TOKEN);
