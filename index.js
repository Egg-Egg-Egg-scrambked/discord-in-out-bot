client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    // ===== イベント確認ログ =====
    console.log(
      '[VC]',
      oldState.channelId,
      '→',
      newState.channelId
    );

    // 同じチャンネルなら無視（ミュート変更など）
    if (oldState.channelId === newState.channelId) return;

    // メンバー取得（undefined対策）
    const member = newState.member || oldState.member;
    const name = member?.displayName || '不明';

    // チャンネル名取得
    const oldChannel = oldState.channel?.name || '不明';
    const newChannel = newState.channel?.name || '不明';

    // OWNER取得（キャッシュ優先）
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
    else if (oldState.channelId && newState.channelId) {
      console.log('移動イベント');
      await user.send(
        `🔁 ${name} が「${oldChannel}」→「${newChannel}」に移動しました`
      );
    }

  } catch (err) {
    console.error('VC通知エラー:', err);
  }
});
