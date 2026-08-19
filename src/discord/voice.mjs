export function createVoiceApi({ client, dryRun, loadVoiceModule, requireApproval, requireChannelPermission }) {
  return {
      status: async guildId => {
        const { getVoiceConnection } = await loadVoiceModule();
        const connection = getVoiceConnection(String(guildId));
        return connection ? { guildId: String(guildId), status: connection.state?.status ?? 'unknown', connected: true } : { guildId: String(guildId), connected: false };
      },
      join: async (channelId, operationOptions = {}) => {
        const channel = client.channels.cache.get(String(channelId));
        if (!channel?.isVoiceBased?.() && !['voice', 'stage'].includes(channel?.type)) throw Object.assign(new Error(`Voice channel not found: ${channelId}`), { code: 'VOICE_CHANNEL_REQUIRED', exitCode: 2 });
        const guild = channel.guild;
        requireChannelPermission(channelId, 'Connect');
        requireApproval('Joining a voice channel', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, channelId: String(channelId), joined: true };
        if (!guild?.voiceAdapterCreator) throw Object.assign(new Error('Voice adapter is unavailable for this guild.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
        const { joinVoiceChannel } = await loadVoiceModule();
        const connection = joinVoiceChannel({ channelId: String(channelId), guildId: String(guild.id), adapterCreator: guild.voiceAdapterCreator, selfDeaf: false });
        return { guildId: String(guild.id), channelId: String(channelId), status: connection.state?.status ?? 'connecting', joined: true };
      },
      leave: async (guildId, operationOptions = {}) => {
        requireApproval('Leaving a voice channel', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: String(guildId), left: true };
        const { getVoiceConnection } = await loadVoiceModule();
        const connection = getVoiceConnection(String(guildId));
        if (connection) connection.destroy();
        return { guildId: String(guildId), left: true };
      },
    };
}
