const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quickabdest')
        .setDescription('Hızlı bir şekilde abdest al.'),
    async execute(interaction) {
        const embed = {
            color: 0x00FF00, // Yeşil renk, temizliği simgeler
            title: 'Hızlı Abdest Alındı!',
            description: 'Hızlıca abdest aldınız, artık hazırsınız!',
        };

        // Kullanıcıya sadece onun görebileceği şekilde embed ile cevap ver
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
