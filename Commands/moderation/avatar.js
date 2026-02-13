const { SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

// Bot sahibinin kullanıcı ID'sini burada tanımlayın
const botOwnerId = '323975996829073418'; // Buraya kendi kullanıcı ID'nizi yazın

module.exports = {
    owner: true,
    data: new SlashCommandBuilder()
        .setName('bot-animated-avatar')
        .setDescription('Bot avatarını ayarla')
        .addAttachmentOption(option =>
            option.setName('avatar')
                .setDescription('Eklemek istediğin avatar')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            // Kullanıcı ID'si bot sahibinin ID'si ile eşleşiyor mu?
            if (interaction.user.id !== botOwnerId) {
                return interaction.reply({ content: "Bu komutu sadece bot sahibi kullanabilir.", ephemeral: true });
            }

            // Server ayarlarını çekme ve izin verilen kanal ID'sini alma
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.moderation_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Moderasyon kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Moderasyon"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const { options } = interaction;
            const avatar = options.getAttachment('avatar');

            async function sendMessage(message) {
                const embed = new EmbedBuilder()
                    .setColor('Blurple')
                    .setDescription(message);

                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }

            if (avatar.contentType !== "image/gif" && avatar.contentType !== "image/png") {
                return await sendMessage(`⚠️ Lütfen PNG veya GIF formatı kullan.`);
            }

            try {
                // Axios kullanarak avatarı indirip botun avatarını ayarlama
                const response = await axios.get(avatar.url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');

                await client.user.setAvatar(buffer);

                await sendMessage('Avatar başarıyla yüklendi.');
            } catch (err) {
                console.log(`⚠️ Error: ${err.toString()}`);
                return await sendMessage(`⚠️ Hata: \`${err.toString()}\``);
            }
        } catch (error) {
            console.error('Avatar komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'Avatar komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
};
