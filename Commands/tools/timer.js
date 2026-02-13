const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timer')
        .setDescription('Belirtilen süre sonunda bir hatırlatma mesajı gönderir.')
        .addIntegerOption(option =>
            option.setName('süre')
                .setDescription('Beklenecek süre (saniye cinsinden)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Gönderilecek mesaj')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            
        const süre = interaction.options.getInteger('süre');
        const mesaj = interaction.options.getString('mesaj') || 'Süre doldu!';
        
        if (süre <= 0) {
            return interaction.reply({ content: 'Lütfen 1 saniyeden uzun bir süre girin.', ephemeral: true });
        }

        await interaction.reply(`Zamanlayıcı ayarlandı! ${süre} saniye sonra hatırlatma yapılacak.`);

        setTimeout(() => {
            interaction.followUp(mesaj);
        }, süre * 1000);
    } catch (error) {
        console.error('timer komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'timer komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    },
};
