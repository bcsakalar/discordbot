const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Coin = require('../../Models/Coin');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinbilgi')
        .setDescription('Coin Bilgisi'),

    async execute(interaction) {
        try {
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.game_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Oyun kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Oyun"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

            const userId = interaction.user.id;
            let userCoins = await Coin.findOne({ userId });

            if (!userCoins) {
                return interaction.reply('Coin bulunamadı.');
            }

            const coinEmbed = new EmbedBuilder()
            .setColor('Green')
            .setDescription(`**Coin Bilgileriniz: ${userCoins.coins}**`)
            .setTimestamp();

            await interaction.reply({ embeds: [coinEmbed] });
        } catch (error) {
            console.error('Coin bilgilerini getirirken hata oluştu', error);
            await interaction.reply('Coin bilgilerini getirirken hata oluştu');
        }
    },
};