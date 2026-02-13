const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radiaim')
        .setDescription('Radiant aimini aktifleştir.'),
    async execute(interaction) {
        const embed = {
            color: 0xFF0000, // Radiant için kırmızı renk
            title: 'Radiant Aim Aktif',
            description: 'Radiant aim’iniz açıldı!',
        };

        // Kullanıcıya sadece onun görebileceği şekilde embed ile cevap ver
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
