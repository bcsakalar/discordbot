const { SlashCommandBuilder } = require('discord.js');
const MessageModel = require('../../Models/AnimalRoles'); // Yeni modeli içe aktar

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hayvanrolver')
        .setDescription('Kedi ve köpek rolleri atamak için emojiye tıklayın.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Mesajın gönderileceği kanalı seçin.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('kedirolu')
                .setDescription('Kedi rolünü seçin.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('kopekrolu')
                .setDescription('Köpek rolünü seçin.')
                .setRequired(true)),
    async execute(interaction) {
        const allowedUserIds = ['323975996829073418', '429679990611771404'];

        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Bu komutu kullanma izniniz yok. Bu komut özel bir komut', ephemeral: true });
        }

        // Yanıtı hemen erteleyin
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.options.getChannel('kanal');
            const catRole = interaction.options.getRole('kedirolu');
            const dogRole = interaction.options.getRole('kopekrolu');

            if (!channel || !catRole || !dogRole) {
                return interaction.editReply({ content: 'Bir hata oluştu. Lütfen tüm seçenekleri doğru girdiğinizden emin olun.' });
            }

            if (!interaction.guild.members.me.permissions.has('MANAGE_ROLES')) {
                return interaction.editReply({ content: 'Rolleri yönetmek için iznim yok.' });
            }

            // Mesaj gönderin ve ID'sini saklayın
            const message = await channel.send({
                content: 'Köpek rolü için 🐕 emojisine, kedi rolü için 🐈 emojisine tıklayın.',
            });

            await message.react('🐕');
            await message.react('🐈');

            // Mesaj, kanal ve rol ID'lerini veritabanına kaydedin
            await MessageModel.create({
                messageId: message.id,
                channelId: channel.id,
                guildId: interaction.guild.id,
                catRoleId: catRole.id,
                dogRoleId: dogRole.id
            });

            setupReactionCollector(message, catRole, dogRole);

            await interaction.editReply({ content: 'Mesaj gönderildi ve tepkiler ayarlandı! Bu mesaj artık süresiz aktif.' });
        } catch (error) {
            console.error('Komut hatası:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' });
        }
    },
    restoreReactionCollector // Fonksiyonu doğru bir şekilde dışa aktarın
};

// Kolektörü kuran fonksiyon
function setupReactionCollector(message, catRole, dogRole) {
    const filter = (reaction, user) => {
        return ['🐕', '🐈'].includes(reaction.emoji.name) && !user.bot;
    };

    const collector = message.createReactionCollector({ filter, dispose: true });

    collector.on('collect', async (reaction, user) => {
        try {
            const member = await message.guild.members.fetch(user.id);

            // Rolün geçerli olduğundan emin olun
            if (!catRole || !dogRole) {
                console.error('Rol hatası: Geçersiz rol.');
                return;
            }

            if (reaction.emoji.name === '🐕') {
                await member.roles.add(dogRole.id); // Rol ID'sini kullanarak rolü ekleyin
                await member.roles.remove(catRole.id); // Rol ID'sini kullanarak rolü kaldırın
                const catReaction = message.reactions.cache.get('🐈');
                if (catReaction) await catReaction.users.remove(user.id);
            } else if (reaction.emoji.name === '🐈') {
                await member.roles.add(catRole.id); // Rol ID'sini kullanarak rolü ekleyin
                await member.roles.remove(dogRole.id); // Rol ID'sini kullanarak rolü kaldırın
                const dogReaction = message.reactions.cache.get('🐕');
                if (dogReaction) await dogReaction.users.remove(user.id);
            }
        } catch (error) {
            console.error('Rol değiştirme hatası:', error);
        }
    });

    collector.on('remove', async (reaction, user) => {
        try {
            const member = await message.guild.members.fetch(user.id);

            // Rolün geçerli olduğundan emin olun
            if (!catRole || !dogRole) {
                console.error('Rol hatası: Geçersiz rol.');
                return;
            }

            if (reaction.emoji.name === '🐕') {
                await member.roles.remove(dogRole.id); // Rol ID'sini kullanarak rolü kaldırın
            } else if (reaction.emoji.name === '🐈') {
                await member.roles.remove(catRole.id); // Rol ID'sini kullanarak rolü kaldırın
            }
        } catch (error) {
            console.error('Rol kaldırma hatası:', error);
        }
    });
}

async function restoreReactionCollector(client) {
    try {
        const messages = await MessageModel.find();
        for (const data of messages) {
            const channel = client.channels.cache.get(data.channelId);
            if (channel) {
                channel.messages.fetch(data.messageId).then(async message => {
                    // Sunucuyu alın
                    const guild = client.guilds.cache.get(data.guildId);

                    if (!guild) {
                        console.error('Sunucu bulunamadı.');
                        return;
                    }

                    // Rolleri ID'lerine göre alın
                    const catRole = guild.roles.cache.get(data.catRoleId); 
                    const dogRole = guild.roles.cache.get(data.dogRoleId); 

                    if (!catRole || !dogRole) {
                        console.error('Rol hatası: Geçersiz rol.');
                        return;
                    }

                    // Reaksiyon kolektörünü yeniden kur
                    setupReactionCollector(message, catRole, dogRole);
                }).catch(err => console.error('Mesaj bulunamadı:', err));
            }
        }
    } catch (error) {
        console.error('Kolektörleri geri yüklerken hata:', error);
    }
}
