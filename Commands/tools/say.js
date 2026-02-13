const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDescription('Belirtilen mesajı bot kendi göndermiş gibi yazar.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Botun göndermesini istediğiniz mesaj')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Mesajın gönderileceği kanal')
                .setRequired(false)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        // Botun gerekli izinlere sahip olduğundan emin olun
        if (!channel.permissionsFor(interaction.guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages])) {
            return interaction.reply({ content: 'Botun bu kanalda mesaj göndermek veya mesajları yönetmek için yeterli izni yok.', ephemeral: true });
        }

        try {
            // Bot mesajı gönderir
            await channel.send(message);

            // Etkileşimi başarılı şekilde tamamlayın
            if (interaction.channel.id === channel.id) {
                await interaction.reply({ content: 'Mesaj başarıyla gönderildi!', ephemeral: true }); // Yanıtı başarılı olarak tamamla.
                setTimeout(() => interaction.deleteReply().catch(console.error), 5000); // Yanıtı 5 saniye sonra siler.
            } else {
                await interaction.reply({ content: 'Mesaj başarıyla gönderildi!', ephemeral: true });
            }
        } catch (error) {
            console.error('Mesaj gönderme sırasında bir hata oluştu:', error);

            // Hata oluşursa yanıtla
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
            }
        }
    },
};
