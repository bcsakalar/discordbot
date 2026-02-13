const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../Models/Giveaway');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cekilis-bitir')
        .setDescription('Çekilişi bitirir ve kazananı belirler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

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

        const giveaway = await Giveaway.findOne({ channelId: interaction.channel.id, ended: false });

        if (!giveaway) {
            return interaction.reply({ content: 'Bu kanalda aktif bir çekiliş bulunmamaktadır.', ephemeral: true });
        }

        await endGiveaway(giveaway, interaction.client);
        await interaction.reply({ content: 'Çekiliş sona erdi ve kazanan belirlendi!', ephemeral: true });
    } catch (error) {
        console.error('çekiliş bitir komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'çekiliş bitir sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};

async function endGiveaway(giveaway, client) {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);

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
}
