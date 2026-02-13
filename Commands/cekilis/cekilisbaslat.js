const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../Models/Giveaway'); // Ensure this path points correctly to your giveaway model
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cekilis-baslat')
        .setDescription('Bir çekiliş başlatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addStringOption(option => 
            option.setName('odul')
                .setDescription('Çekiliş ödülünü giriniz.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('süre')
                .setDescription('Çekiliş süresi (dakika olarak).')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('kazanan-sayisi')
                .setDescription('Kaç kişi kazanacak?')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.cekilis_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Çekiliş kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Çekiliş"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const ödül = interaction.options.getString('odul');
        const süre = interaction.options.getInteger('süre');
        const kazananSayisi = interaction.options.getInteger('kazanan-sayisi');
        const endTime = new Date(Date.now() + süre * 60000); // Süreyi milisaniyeye çevirin

        const embed = new EmbedBuilder()
            .setTitle('Çekiliş!')
            .setDescription(`**Ödül:** ${ödül}\nÇekilişe katılmak için aşağıdaki 🎉 tepkisine tıklayın!\n**Süre:** ${formatDuration(süre)}\n**Kazanan-Sayısı:** ${kazananSayisi}`)
            .setColor('#5865F2')
            .setFooter({ text: 'Çekilişi başlatan: ' + interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        const message = await interaction.channel.send({ embeds: [embed] });
        await message.react('🎉');

        const giveaway = new Giveaway({
            channelId: interaction.channel.id,
            messageId: message.id,
            prize: ödül,
            endTime: endTime,
            winnerCount: kazananSayisi,
            participants: []
        });

        await giveaway.save();
        await interaction.reply({ content: 'Çekiliş başlatıldı!', ephemeral: true });

        setTimeout(async () => {
            const currentGiveaway = await Giveaway.findById(giveaway.id);
            if (!currentGiveaway || currentGiveaway.ended) {
                console.log(`Çekiliş zaten bitti: ${giveaway.id}`);
                return;
            }
            await endGiveaway(currentGiveaway, interaction.client);
        }, süre * 60000);
    } catch (error) {
        console.error('çekiliş başlat komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'çekiliş başlat sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};

async function endGiveaway(giveaway, client) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        if (!giveaway.participants.length) {
            await channel.send({ content: 'Çekilişe katılan kimse olmadı, dolayısıyla çekiliş iptal edildi.' });
            giveaway.ended = true;
            await giveaway.save();
            await Giveaway.deleteOne({ _id: giveaway._id });
            return;
        }

        const winners = [];
        for (let i = 0; i < giveaway.winnerCount; i++) {
            if (!giveaway.participants.length) break;
            const winnerId = giveaway.participants.splice(Math.floor(Math.random() * giveaway.participants.length), 1)[0];
            const winner = await client.users.fetch(winnerId);
            winners.push(winner.tag);
        }

        const embed = new EmbedBuilder()
            .setTitle('Çekiliş Sonucu!')
            .setDescription(`Kazananlar: ${winners.join(', ')} 🎉\n**Ödül:** ${giveaway.prize}`)
            .setColor('#5865F2')
            .setFooter({ text: 'Çekilişi başlatan: ' + message.author.tag, iconURL: message.author.displayAvatarURL() });

        await channel.send({ embeds: [embed] });
        giveaway.ended = true;
        await giveaway.save();
        await Giveaway.deleteOne({ _id: giveaway._id });
    } catch (error) {
        console.error(`Çekiliş bitirme sırasında bir hata oluştu: ${error}`);
    }
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let durationString = '';

    if (days > 0) {
        durationString += `${days} gün `;
    }

    if (remainingHours > 0) {
        durationString += `${remainingHours} saat `;
    }

    if (remainingMinutes > 0) {
        durationString += `${remainingMinutes} dakika`;
    }

    return durationString.trim();
}
