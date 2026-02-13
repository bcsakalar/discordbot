const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setinstachannel')
        .setDescription('Insta bildirimleri için kanalı ayarlar')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Insta bildirim kanalı')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id !== '323975996829073418') { // Replace with your Discord user ID
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) { // Ensure it's a text channel
            return interaction.reply({ content: 'Lütfen geçerli bir metin kanalı seçin.', ephemeral: true });
        }

        await ServerSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { insta_notification_channel: channel.id },
            { upsert: true }
        );

        return interaction.reply(`Instagram bildirim kanalı **${channel.name}** olarak ayarlandı.`);
    },
};
