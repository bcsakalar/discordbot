const { SlashCommandBuilder } = require('discord.js');
const Coin = require('../../Models/Coin');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Günlük 500 coin al'),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
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

        let user = await Coin.findOne({ userId });

        if (!user) {
            user = new Coin({ userId });
        }

        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        if (!user.lastDaily || (now - user.lastDaily) > oneDay) {
            user.coins += 1000;
            user.lastDaily = now;
            await user.save();

            await interaction.reply('Günlük 500 jetonunuzu aldınız!');
        } else {
            const nextDaily = new Date(user.lastDaily.getTime() + oneDay);
            const timeRemaining = nextDaily - now;

            const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

            await interaction.reply(`Günlük paralarınızı zaten topladınız. ${hours} saat, ${minutes} dakika ve ${seconds} saniye sonra tekrar toplayabilirsiniz.`);
        }
    } catch (error) {
        console.error('coin bilgileri sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'coin bilgileri getirilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};
