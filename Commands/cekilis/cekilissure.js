const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Giveaway = require('../../Models/Giveaway');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cekilis-sure')
        .setDescription('Devam eden çekilişin kalan süresini gösterir.'),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.cekilis_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Çekiliş kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Çekiliş"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }
        
        const giveaway = await Giveaway.findOne({ channelId: interaction.channel.id, ended: false });

        if (!giveaway) {
            return interaction.reply({ content: 'Bu kanalda aktif bir çekiliş bulunmamaktadır.', ephemeral: true });
        }

        const now = new Date();
        const timeLeft = giveaway.endTime - now;

        if (timeLeft <= 0) {
            return interaction.reply({ content: 'Çekiliş zaten sona ermiş durumda.', ephemeral: true });
        }

        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

        const embed = new EmbedBuilder()
            .setTitle('Çekiliş Süresi')
            .setDescription(`Çekilişin bitmesine kalan süre: ${minutesLeft} dakika ${secondsLeft} saniye`)
            .setColor('#5865F2');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('çekiliş süre komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'çekiliş süre sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};