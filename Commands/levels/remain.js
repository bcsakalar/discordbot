const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const Levels = require('discord.js-leveling');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
        .setName('remain')
        .setDescription('Seviyelerin kaç xp olduğuna bak')
        .addIntegerOption(option => 
            option.setName('seviye')
           .setDescription("İstenen seviyenin XP'si")
           .setRequired(true)
        ),

    async execute(interaction)
    {
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

        const {options} = interaction;
        const level = options.getInteger('seviye');
        const xpAmount = Levels.xpFor(level);

        interaction.reply({content: `Seviye **${level}** düzeyine ulaşmak için **${xpAmount} xp** gerekiyor`});
    } catch (error) {
        console.error('remain komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'remain komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
}
