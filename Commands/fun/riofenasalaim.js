const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('riofenasalaim')
    .setDescription('rio fenasal aim real'),
    
    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.fun_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Eğlence kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Eğlence"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        await interaction.reply({content: 'https://kick.com/beta44/clips/clip_01J6FEQX1G3WK4N85E6K6HT6XW'});
    } catch (error) {
        console.error('mert komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'mert komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
}