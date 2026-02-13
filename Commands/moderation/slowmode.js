const {SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType} = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
   .setName("slowmode")
   .setDescription("Kanalın Slowmode Süresini Değiştirir")
   .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
   .addIntegerOption(option => 
    option.setName("duration")
    .setDescription("Yavaş modun süresi(Saniye)")
    .setRequired(true)
   )
   .addChannelOption(option =>
    option.setName("channel")
    .setDescription("Yavaş modu uygulanacak kanal")
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildText)
   ),

   async execute(interaction)
   {
    try {
        // Fetch server settings to get the allowed game channel ID
        const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
        const allowedChannelId = serverSettings?.moderation_channel;

        if (!allowedChannelId) {
            return interaction.reply({ content: "Modearasyon kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
        }

        if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            return interaction.reply({ 
                content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Moderasyon"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                ephemeral: true 
            });
        }

    const {options} = interaction;
    const channel = interaction.options.getChannel("channel");
    const duration = interaction.options.getInteger("duration");

    const embed = new EmbedBuilder()
    .setColor("Green")
    .setDescription(`☑️ ${channel} kanalına ${duration} saniyelik **Yavaş Mod** Uygulanmıştır`)

    channel.setRateLimitPerUser(duration).catch(err => {
        return;
    });
    
    await interaction.reply({embeds: [embed]});
} catch (error) {
    console.error('slowmode komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'slowmode komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}

   }
}