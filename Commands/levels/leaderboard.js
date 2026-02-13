const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Levels = require('discord.js-leveling');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Liderlik tablosunu incele'),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.levels_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Levels kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Level"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }
            
        const { guildId, client } = interaction;
        const rawLeaderboard = await Levels.fetchLeaderboard(guildId, 5); // Top 5 kullanıcıyı getir

        try {
            if (rawLeaderboard.length < 1) return interaction.reply("Liderlik tablosunda henüz kimse yok.");

            const leaderboard = await Levels.computeLeaderboard(client, rawLeaderboard, true);
            const lb = leaderboard.map(e => `**${e.position}.** ${e.username}\n**Seviye:** ${e.level}\n**XP:** ${e.xp.toLocaleString()}`);

            const embed = new EmbedBuilder()
                .setTitle('Liderlik Tablosu')
                .setDescription(lb.join('\n\n'))
                .setColor('#3498db') // Embed rengi
                .setTimestamp()
                .setFooter({ text: `Toplam ${leaderboard.length} kişi` });

            return interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e); // Hata ayıklama için hata mesajını konsola yazdır
            return interaction.reply({ content: "Bu işlemi gerçekleştiremiyorum. Lütfen daha sonra tekrar deneyiniz" });
        }
    } catch (error) {
        console.error('leaderboard komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'leaderboard komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
}
