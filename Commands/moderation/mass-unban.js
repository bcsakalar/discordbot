const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("toplu-unban")
        .setDescription("Herkesin banını kaldırır")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
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

        const { guild } = interaction;
        const users = await interaction.guild.bans.fetch();
        const ids = users.map(u => u.user.id);

        if (users.size === 0) {
            return await interaction.reply({ content: "Sunucuda banlanmış kimse yok", ephemeral: true });
        } else {
            await interaction.reply({ content: "Herkesin banı kaldırılıyor, eğer çok fazla kişi banlanmış ise bu biraz zaman alabilir..." });
        }

        for (const id of ids) {
            await guild.members.unban(id).catch(err => {
                return interaction.editReply({ content: `${err.rawError}`, ephemeral: true });
            });
        }

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`☑️ ${ids.length} üyenin banı, sunucudan **Kaldırılmıştır**`);

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('mass unban komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'mass unban komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};
