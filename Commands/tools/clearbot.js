const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbot')
        .setDescription('Bot tarafından gönderilen mesajları temizler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı')
                .setRequired(true)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar');
        
        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Lütfen 1 ile 100 arasında bir sayı girin.', ephemeral: true });
        }

        const messages = await interaction.channel.messages.fetch({ limit: amount });

        const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id);

        if (botMessages.size === 0) {
            return interaction.reply({ content: 'Bu kanalda bot tarafından gönderilen mesaj bulunamadı.', ephemeral: true });
        }

        await interaction.channel.bulkDelete(botMessages, true).catch(error => {
            console.error(error);
            return interaction.reply({ content: 'Mesajları silerken bir hata oluştu.', ephemeral: true });
        });

        return interaction.reply({ content: `${botMessages.size} mesaj başarıyla silindi.`, ephemeral: true });
    },
};
