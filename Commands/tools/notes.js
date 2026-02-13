const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const userTaskSchema = require('../../Models/userTaskSchema');
const serverTaskSchema = require('../../Models/serverTaskSchema');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notepad')
        .setDescription('📓 | Not Defteri')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(command =>
            command.setName('add')
                .setDescription('📓 | Not Ekle')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Kullanıcı/Sunucu')
                        .setRequired(true)
                        .setChoices(
                            { name: 'user', value: 'u' },
                            { name: 'server', value: 's' }
                        ))
                .addStringOption(option =>
                    option.setName('new-note')
                        .setDescription('Yeni Not Ekle')
                        .setRequired(true))
        )
        .addSubcommand(command =>
            command.setName('remove')
                .setDescription('📓 | Not Kaldır')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Kullanıcı/Sunucu')
                        .setRequired(true)
                        .setChoices(
                            { name: 'user', value: 'u' },
                            { name: 'server', value: 's' }
                        ))
                .addNumberOption(option =>
                    option.setName('note-id')
                        .setDescription("Not 'ID'si")
                        .setRequired(true))
        )
        .addSubcommand(command =>
            command.setName('list')
                .setDescription('📓 | Notları gösterir')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Kullanıcı/Sunucu')
                        .setRequired(true)
                        .setChoices(
                            { name: 'user', value: 'u' },
                            { name: 'server', value: 's' }
                        ))
        )
        .addSubcommand(command =>
            command.setName('removeall')
                .setDescription('📓 | Tüm notları kaldır')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Kullanıcı/Sunucu')
                        .setRequired(true)
                        .setChoices(
                            { name: 'user', value: 'u' },
                            { name: 'server', value: 's' }
                        ))
        ),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.tools_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Araçlar kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Araçlar"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const { options, user, guildId } = interaction;
        const sub = options.getSubcommand();
        const type = options.getString('type');
        const newTask = options.getString('new-note');
        const taskId = options.getNumber('note-id');

        const taskObject = { description: newTask };

        try {
            if (type === 'u') {
                if (sub === 'add') {
                    const data = await userTaskSchema.findOne({ UserId: user.id });
                    if (!data) {
                        await userTaskSchema.create({
                            UserId: user.id,
                            Task: [taskObject]
                        });

                        const embed = new EmbedBuilder()
                            .setTitle('Yeni Not')
                            .setDescription(`🟩 | Listene yeni not eklendi: \`${newTask}\`\n\nListede \`1\` not var`)
                            .setColor('Green')
                            .setFooter({ text: 'Not Ekleme Başarılı'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        data.Task.push(taskObject);
                        await data.save();

                        const embed = new EmbedBuilder()
                            .setTitle('Yeni Not')
                            .setDescription(`🟩 | Listene yeni not eklendi: \`${newTask}\`\n\nListede \`${data.Task.length}\` not oldu`)
                            .setColor('Green')
                            .setFooter({ text: 'Not Ekleme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'remove') {
                    const data = await userTaskSchema.findOne({ UserId: user.id });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        data.Task.splice(taskId - 1, 1);
                        await data.save();

                        if (data.Task.length === 0) {
                            await userTaskSchema.deleteOne({ UserId: user.id });
                        }

                        const embed = new EmbedBuilder()
                            .setDescription(`🗑️ | Başarılı bir şekilde ${taskId} notu listeden silindi`)
                            .setColor('Grey')
                            .setFooter({ text: 'Not Silme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'removeall') {
                    const data = await userTaskSchema.findOneAndDelete({ UserId: user.id });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setDescription(`🗑️ | Tüm notlar listeden silindi`)
                            .setColor('Grey')
                            .setFooter({ text: 'Not Silme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'list') {
                    const data = await userTaskSchema.findOne({ UserId: user.id });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed]});
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle('Not Defteri')
                            .setDescription(`${user} Notların:\n\n${data.Task.map((w, i) => `Id: \`${i + 1}\` Not: \`${w.description}\``).join('\n\n')}`)
                            .setColor('Yellow')
                            .setFooter({ text: 'Not Listesi'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed]});
                    }
                }
            } else if (type === 's') {
                if (!guildId) return interaction.reply({ content: `🔴 | Bu komut sadece sunucu için`, ephemeral: true });

                if (sub === 'add') {
                    const data = await serverTaskSchema.findOne({ GuildId: guildId });
                    if (!data) {
                        await serverTaskSchema.create({
                            GuildId: guildId,
                            Task: [taskObject]
                        });

                        const embed = new EmbedBuilder()
                            .setTitle('Yeni Not')
                            .setDescription(`🟩 | Listene yeni not eklendi: \`${newTask}\`\n\nListede \`1\` not var`)
                            .setColor('Green')
                            .setFooter({ text: 'Not Ekleme Başarılı'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        data.Task.push(taskObject);
                        await data.save();

                        const embed = new EmbedBuilder()
                            .setTitle('Yeni Not')
                            .setDescription(`🟩 | Listene yeni not eklendi: \`${newTask}\`\n\nListede \`${data.Task.length}\` not oldu`)
                            .setColor('Green')
                            .setFooter({ text: 'Not Ekleme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'remove') {
                    const data = await serverTaskSchema.findOne({ GuildId: guildId });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        data.Task.splice(taskId - 1, 1);
                        await data.save();

                        if (data.Task.length === 0) {
                            await serverTaskSchema.deleteOne({ GuildId: guildId });
                        }

                        const embed = new EmbedBuilder()
                            .setDescription(`🗑️ | Başarılı bir şekilde ${taskId} notu, sunucu listesinden silindi`)
                            .setColor('Grey')
                            .setFooter({ text: 'Not Silme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'removeall') {
                    const data = await serverTaskSchema.findOneAndDelete({ GuildId: guildId });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setDescription(`🗑️ | Tüm notlar sunucu listesinden silindi`)
                            .setColor('Grey')
                            .setFooter({ text: 'Not Silme Başarılı'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else if (sub === 'list') {
                    const data = await serverTaskSchema.findOne({ GuildId: guildId });
                    if (!data) {
                        const embed = new EmbedBuilder()
                            .setDescription(`🔴 - Veri Bulunamadı`)
                            .setColor('DarkRed')
                            .setFooter({ text: 'Hata'})
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed]});
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle('Not Defteri')
                            .setDescription(`${user}, Sunucudaki Notlar:\n\n${data.Task.map((w, i) => `Id: \`${i + 1}\` Not: \`${w.description}\``).join('\n\n')}`)
                            .setColor('Yellow')
                            .setFooter({ text: 'Not Listesi'})
                            .setTimestamp();

                        return interaction.reply({ embeds: [embed]});
                    }
                }
            }
        } catch (err) {
            const embed = new EmbedBuilder()
                .setDescription(`🔴 | Hata: ${err.message}`)
                .setColor('Random')
                .setFooter({ text: 'Hata'})
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('notes komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'notes komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};
