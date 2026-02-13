const { SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

// Bot sahibinin kullanıcı ID'sini burada tanımlayın
const botOwnerId = '323975996829073418'; // Buraya kendi kullanıcı ID'nizi yazın

module.exports = {
    owner: true,
    data: new SlashCommandBuilder()
        .setName('botbanner')
        .setDescription('bot banner ayarla')
        .addAttachmentOption(option =>
            option.setName('banner')
                .setDescription('Eklemek istediğin banner')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            // Komutu kullanan kişinin ID'si, bot sahibinin ID'si ile eşleşiyor mu?
            if (interaction.user.id !== botOwnerId) {
                return interaction.reply({ content: "Bu komutu sadece bot sahibi kullanabilir.", ephemeral: true });
            }
            
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
            const banner = options.getAttachment('banner');

            async function sendMessage(message) {
                const embed = new EmbedBuilder()
                    .setColor('Blurple')
                    .setDescription(message);

                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }

            if (banner.contentType !== "image/gif" && banner.contentType !== "image/png") {
                return await sendMessage(`⚠️ lütfen png veya gif formatı kullan`);
            }

            try {
                const response = await axios.get(banner.url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');
                const resolvedImage = `data:${banner.contentType};base64,${buffer.toString('base64')}`;

                await client.rest.patch(Routes.user(), {
                    body: { banner: resolvedImage }
                });

                await sendMessage(`banner yüklendi`);
            } catch (err) {
                console.log(`⚠️ Error: \`${err.toString()}\``);
            }
        } catch (error) {
            console.error('banner komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'banner komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
};
