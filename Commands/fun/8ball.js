const { SlashCommandBuilder } = require("discord.js");
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("8ball")
        .setDescription("8 topuna sor")
        .addStringOption(option =>
            option.setName("soru")
                .setDescription("8 topuna bir soru sor")
                .setRequired(true)
        ),
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
            
            let sekiztop = [
                'Kesinlikle öyle.',
                'Kesinlikle evet.',
                'Kesinlikle.',
                'Evet, kesinlikle.',
                'Buna güvenebilirsin.',
                'Bence evet.',
                'Çok muhtemel.',
                'Görünüşe göre evet.',
                'Evet.',
                'İşaretler evet diyor.',
                'Cevap belirsiz, tekrar dene.',
                'Daha sonra tekrar sor.',
                'Şu an söylemem daha iyi olur.',
                'Şu an tahmin edemem.',
                'Konsantre ol ve tekrar sor.',
                'Buna güvenme.',
                'Cevabım hayır.',
                'Kaynaklarım hayır diyor.',
                'Görünüşe göre kötü.',
                'Çok şüpheli.',
                'Kesinlikle hayır.',
                'Belki.',
                'Cevap sende gizli.',
                'Hayır.',
                'CS tanrısının ruh haline bağlı.',
                '||Hayır||',
                '||Evet||',
                'Bekle biraz.',
                'Her şey bitti.',
                'İşte başlangıç.',
                'İyi şanslar.',
            ];
            let indeks = (Math.floor(Math.random() * Math.floor(sekiztop.length)));
            setTimeout(() => {
                interaction.reply({
                    content: sekiztop[indeks],
                });
            }, 750);
        } catch (error) {
            console.error('8ball komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: '8ball komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
};
