const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Komut listesine getir')
        .addStringOption(option => 
            option.setName('kategori')
                .setDescription('Gösterilecek komut kategorisini seçin')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const emojis = {
                game: '🎮',
                fun: '⚱️',
                moderation: '⚔️',
                tools: '🧰',
                info: '💁',
                ticket: '🎫',
                moderationrole: '⚔️',
                levels: '🎚️',
                cekilis: '🎉',
                reactor: '🫡',
                poll: '📋',
                valorant: '🎮'
            };

            const excludedCategories = ['kick', 'instagram']; // Exclude both "kick" and "instagram" categories
            const directories = [...new Set(interaction.client.commands.map((cmd) => cmd.folder))].filter(dir => dir && !excludedCategories.includes(dir));

            const formatString = (str) => {
                if (!str || typeof str !== 'string' || str.length === 0) return '';
                return `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;
            };

            const categories = directories.map((dir) => {
                const getCommands = interaction.client.commands.filter((cmd) => cmd.folder === dir).map((cmd) => {
                    return {
                        name: cmd.data.name,
                        description: cmd.data.description || "Bu komut için bir açıklama yok",
                    };
                });
                return {
                    directory: formatString(dir),
                    commands: getCommands,
                };
            });

            const generateEmbed = (category) => {
                const categoryData = categories.find(cat => cat.directory === category);
                const embed = new EmbedBuilder()
                    .setTitle(`${emojis[categoryData.directory.toLowerCase()] || ''} ${categoryData.directory} Kategorisi`)
                    .setDescription(categoryData.commands.map((cmd) => `\`${cmd.name}\`: ${cmd.description}`).join('\n'))
                    .addFields({ name: 'Diğer Kategoriler', value: categories.map(cat => `\`${cat.directory}\``).join(', ') })
                    .setFooter({ text: `ICARDI | ${moment().format('LL')}` });

                return embed;
            };

            const selectedCategory = interaction.options.getString('kategori');
            if (selectedCategory) {
                const category = categories.find(cat => cat.directory.toLowerCase() === selectedCategory.toLowerCase());
                if (category) {
                    const embed = generateEmbed(category.directory);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    return interaction.reply({ content: 'Bu kategori bulunamadı.', ephemeral: true });
                }
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select_' + interaction.id) // Unique custom ID
                .setPlaceholder('Bir kategori seçin')
                .addOptions(
                    categories.map(category => ({
                        label: `${category.directory} Kategorisi`,
                        description: `${category.commands.length} komut mevcut`,
                        emoji: emojis[category.directory.toLowerCase()],
                        value: category.directory
                    }))
                );

            const row = new ActionRowBuilder()
                .addComponents(selectMenu);

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Beni Sunucuna Davet Et')
                    .setURL('https://discord.com/oauth2/authorize?client_id=1249383231036330034&permissions=8&integration_type=0&scope=bot+applications.commands')  // Replace with a valid invite link
                    .setStyle(ButtonStyle.Link)
            );

            const botAvatarURL = interaction.client.user.displayAvatarURL({ format: 'png' });  // Get bot's avatar URL

            const initialEmbed = new EmbedBuilder()
                .setAuthor({ name: 'ICARDI', iconURL: botAvatarURL })  // Use the bot's avatar URL
                .setTitle('ICARDI ile Oyun ve Eğlenceye Hazır Olun!')
                .setDescription(
                    "ICARDI ile sunucunuzda oyun oynayabilir, eğlenebilir ve moderasyon araçları ile sunucunuzu yönetebilirsiniz.\n\n" +
                    "Tüm komutları görmek için `/help <kategori>` komutunu kullanabilirsiniz."
                )
                .addFields(
                    { name: 'Önemli Bağlantı:', value: '[Davet Et](https://discord.com/oauth2/authorize?client_id=1249383231036330034&permissions=8&integration_type=0&scope=bot+applications.commands)' },
                    { 
                        name: 'Komut Kategorileri:', 
                        value: `${emojis.game} **Oyun** - Bu botta oyun komutları ile eğlenebilirsiniz\n` +
                               `${emojis.fun} **Eğlence** - Sohbeti renklendiren eğlence komutları\n` +
                               `${emojis.moderation} **Moderasyon** - Sunucuyu yönetmek için moderasyon araçları\n` +
                               `${emojis.tools} **Araçlar** - Sunucunuz için kullanışlı araçlar` 
                    }
                )
                .setFooter({ text: `ICARDI | ${moment().format('LL')}` })  // Footer with bot name and date
                .setThumbnail(botAvatarURL);  // Use the bot's avatar URL as thumbnail

            const message = await interaction.reply({ embeds: [initialEmbed], components: [row, buttonRow], ephemeral: true });

            const filter = (i) => i.customId === 'help_category_select_' + interaction.id && i.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                const selectedCategory = i.values[0];

                try {
                    await i.update({ embeds: [generateEmbed(selectedCategory)], components: [row, buttonRow] });
                } catch (error) {
                    console.error('Interaction collection error:', error);
                    await i.reply({
                        content: 'Bir hata oluştu, lütfen tekrar deneyin.',
                        ephemeral: true,
                    });
                }
            });


        } catch (error) {
            console.error('Help command execution error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Help komutunu çalıştırırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                    ephemeral: true
                });
            }
        }
    },
};
