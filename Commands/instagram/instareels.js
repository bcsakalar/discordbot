const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insta')
        .setDescription('Instagram üzerinde paylaşılan gönderiyi duyurur.')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Paylaşmak istediğiniz Instagram gönderisinin linki')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            // Kullanıcının girdiği linki al
            const instagramLink = interaction.options.getString('link');

            // Sunucu ayarlarını çekerek izin verilen kanal ID'sini al
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.insta_notification_channel;

            if (!allowedChannelId) {
                return interaction.reply({ content: "Instagram bildirim kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }

            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Bilgi"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

            // İzin verilen kullanıcıları kontrol et
            const allowedUsers = ['323975996829073418', '429679990611771404', '1083013153689960468']; // İzin verilen kullanıcı ID'leri buraya ekleyin

            if (!allowedUsers.includes(interaction.user.id)) {
                return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#E1306C')
                .setTitle('📸 Yeni Instagram Gönderisi!')
                .setDescription(`Herkese selam! Instagram üzerinde yeni bir gönderi paylaştım.\n${instagramLink}`) // Link is directly shown
                .setTimestamp()
                .setFooter({ text: 'Yeni Gönderi Paylaşıldı' });

            const channel = interaction.guild.channels.cache.get(allowedChannelId);
            await channel.send({ content: '@everyone', embeds: [embed] });
            return interaction.reply({ content: 'Instagram bildirimi gönderildi!', ephemeral: true });
        } catch (error) {
            console.error('insta komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'insta komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    },
};
