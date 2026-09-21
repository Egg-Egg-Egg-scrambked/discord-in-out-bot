console.log('起動確認');

import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', () => {
  console.log('ログイン成功');
});

console.log('login前');

client.login(process.env.TOKEN)
  .then(() => console.log('login通過'))
  .catch(console.error);
