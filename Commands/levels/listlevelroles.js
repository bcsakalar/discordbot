const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LevelRole = require('../../Models/LevelRoles'); // Model dosyasını içe aktarın
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listlevelroles')
        .setDescription('Belirli bir sunucudaki tüm seviye rollerini listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.levels_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Levels kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Level"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const levelRole = await LevelRole.findOne({ guildId: interaction.guild.id });

        if (!levelRole || levelRole.levelRoles.size === 0) {
            return interaction.reply('Bu sunucuda atanmış seviye rolü bulunmamaktadır.');
        }

        const rolesList = Array.from(levelRole.levelRoles.entries())
            .map(([level, roleId]) => `Seviye ${level}: <@&${roleId}>`)
            .join('\n');

        await interaction.reply(`Mevcut Seviye Rolleri:\n${rolesList}`);
    } catch (error) {
        console.error('listlevelrole komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'listlevelrole komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};
