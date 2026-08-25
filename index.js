import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import express from 'express';
import { WORDS } from './words.js';

// =========================
// Webサーバー
// =========================
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);

// =========================
// Bot
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const OWNER_ID = '545988407118135296';
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const gameSessions = new Map();

// =========================
// コマンド登録
// =========================
const commands = [
  new SlashCommandBuilder().setName('rules').setDescription('ルール'),
  new SlashCommandBuilder().setName('wolf').setDescription('開始'),
  new SlashCommandBuilder().setName('answer').setDescription('答え'),
  new SlashCommandBuilder().setName('end').setDescription('強制終了')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// =========================
// 起動
// =========================
client.once('clientReady', () => {
  console.log(`ログイン: ${client.user.tag}`);
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
// 投票開始
// =========================
async function startVote(interaction, guildId) {
  const session = gameSessions.get(guildId);
  if (!session) return;

  const members = session.members.map(id =>
    interaction.guild.members.cache.get(id)
  );

  const buttons = members.map(m =>
    new ButtonBuilder()
      .setCustomId(`vote_${m.id}`)
      .setLabel(m.displayName)
      .setStyle(ButtonStyle.Secondary)
  );

  const rows = [];
  while (buttons.length) {
    rows.push(new ActionRowBuilder().addComponents(buttons.splice(0, 5)));
  }

  const voteMsg = await interaction.channel.send({
    content: '🗳 投票タイム（60秒）',
    components: rows
  });

  const collector = voteMsg.createMessageComponentCollector({ time: 60000 });

  collector.on('collect', async (i) => {

    if (session.votedUsers.has(i.user.id)) {
      return i.reply({ content: 'もう投票してる', ephemeral: true });
    }

    const target = i.customId.replace('vote_', '');
    session.votes[target] = (session.votes[target] || 0) + 1;
    session.votedUsers.add(i.user.id);

    // 🔥 色変更
    const newRows = voteMsg.components.map(row =>
      new ActionRowBuilder().addComponents(
        row.components.map(btn => {
          if (btn.data.custom_id === i.customId) {
            return ButtonBuilder.from(btn)
              .setStyle(ButtonStyle.Success);
          }
          return btn;
        })
      )
    );

    await i.update({
      content: `🗳 投票中（${session.votedUsers.size}人）`,
      components: newRows
    });
  });

  collector.on('end', async () => {

    const votes = session.votes;

    const results = Object.entries(votes)
      .map(([id, count]) => {
        const m = interaction.guild.members.cache.get(id);
        return `${m?.displayName ?? '不明'}：${count}票`;
      })
      .join('\n') || '投票なし';

    let maxId = null;
    let maxVote = 0;

    for (const [id, count] of Object.entries(votes)) {
      if (count > maxVote) {
        maxVote = count;
        maxId = id;
      }
    }

    const wolves = session.wolfIds;

    const resultText = wolves.includes(maxId)
      ? '🎉 市民の勝ち！'
      : '🐺 人狼の勝ち！';

    await interaction.channel.send(
      `📊 投票結果\n${results}\n\n👉 処刑：${interaction.guild.members.cache.get(maxId)?.displayName ?? 'なし'}\n\n${resultText}`
    );

    gameSessions.delete(guildId);
  });
}

// =========================
// コマンド処理
// =========================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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


  // ===== 開始 =====
  if (interaction.commandName === 'wolf') {

    await interaction.reply('⏱ 何分？（数字）');

    const collector = interaction.channel.createMessageCollector({ time: 15000 });

    collector.on('collect', async (msg) => {

      const time = parseInt(msg.content);
      if (isNaN(time)) return;

      collector.stop();

      const vc = interaction.member.voice.channel;
      if (!vc) return interaction.channel.send('VC入って');

      const members = vc.members.filter(m => !m.user.bot).map(m => m);

      const [cWord, wWord] =
        WORDS[Math.floor(Math.random() * WORDS.length)];

      let wolfCount = members.length >= 6 ? 2 : 1;
      if (members.length >= 10) wolfCount = 3;

      const wolfIndexes = [];
      while (wolfIndexes.length < wolfCount) {
        const r = Math.floor(Math.random() * members.length);
        if (!wolfIndexes.includes(r)) wolfIndexes.push(r);
      }

      const guildId = interaction.guild.id;

      const timeout = setTimeout(() => {
        startVote(interaction, guildId);
      }, time * 60000);

      gameSessions.set(guildId, {
        wolfIds: wolfIndexes.map(i => members[i].id),
        members: members.map(m => m.id),
        votes: {},
        votedUsers: new Set(),
        timer: timeout
      });

      // DM配布
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const word = wolfIndexes.includes(i) ? wWord : cWord;
        try {
          await m.send(`🐺 ワード: ${word}`);
        } catch {}
      }

      await interaction.channel.send(`⏱ ${time}分スタート`);
    });
  }

  // ===== 強制終了 =====
  if (interaction.commandName === 'end') {

    const session = gameSessions.get(interaction.guild.id);
    if (!session) return interaction.reply('ゲームなし');

    clearTimeout(session.timer);

    await interaction.reply('⏹ 強制終了 → 投票');

    startVote(interaction, interaction.guild.id);
  }

  // ===== 答え =====
  if (interaction.commandName === 'answer') {

    const session = gameSessions.get(interaction.guild.id);
    if (!session) return interaction.reply('ゲームなし');

    const names = await Promise.all(
      session.wolfIds.map(id =>
        interaction.guild.members.fetch(id).then(m => m.displayName)
      )
    );

    await interaction.reply(`🐺 人狼: ${names.join(', ')}`);
  }
});

client.login(TOKEN);
