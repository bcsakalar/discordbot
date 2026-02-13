const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const pollschema = require('../../Models/Votes');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anket')
        .setDescription('Anket oluştur')
        .addStringOption(option => option.setName('başlık').setDescription('Anket için başlık seçin').setMinLength(1).setMaxLength(2000).setRequired(true))
        .addIntegerOption(option => option.setName('süre').setDescription('Anket süresi (dakika cinsinden)').setMinValue(1).setRequired(true)),
    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.poll_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Anket kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Anket"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        await interaction.reply({ content: 'Anketiniz başlatıldı', ephemeral: true });
        const topic = interaction.options.getString('başlık');
        const duration = interaction.options.getInteger('süre');
        const endTime = Date.now() + duration * 60000;

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setAuthor({ name: '📊 Anket sistemi'})
            .setFooter({ text: `📊 Anket sona ermesine kalan süre: (${duration}:00)`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
            .setTitle('📊 Anket Başladı')
            .setDescription(`${topic}`)
            .addFields({ name: '👍', value: '**Oy yok**', inline: true })
            .addFields({ name: '👎', value: '**Oy yok**', inline: true });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('up')
                    .setLabel('👍')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('down')
                    .setLabel('👎')
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId('votes')
                    .setLabel('Oylar')
                    .setStyle(ButtonStyle.Secondary),
            );

        const msg = await interaction.channel.send({embeds: [embed], components: [buttons]});
        msg.createMessageComponentCollector();

        await pollschema.create({
            Msg: msg.id,
            Upvote: 0,
            Downvote: 0,
            UpMembers: [],
            DownMembers: [],
            Guild: interaction.guild.id,
            Owner: interaction.user.id,
            EndTime: endTime
        });

        // Süre bitiminde sonuçları gösterme
        setTimeout(async () => {
            const pollData = await pollschema.findOne({ Msg: msg.id });
            if (!pollData) return;

            const resultEmbed = new EmbedBuilder()
                .setColor("Red")
                .setAuthor({ name: '📊 Anket sistemi'})
                .setFooter({ text: `📊 Anket sona erdi`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp()
                .setTitle('📊 Anket Sonuçları')
                .setDescription(`${topic}`)
                .addFields({ name: '👍', value: `**${pollData.Upvote}** Oy`, inline: true })
                .addFields({ name: '👎', value: `**${pollData.Downvote}** Oy`, inline: true });

            await msg.edit({ embeds: [resultEmbed], components: [] });

            await pollschema.findOneAndDelete({ Msg: msg.id });
        }, duration * 60000); // Süre (dakika cinsinden) sonra çalışacak

    } catch (error) {
        console.error('poll komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'poll komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
};