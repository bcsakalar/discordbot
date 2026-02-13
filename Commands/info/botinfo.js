const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const cpustat = require("cpu-stat");
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Bot hakkında bilgi al'),

    async execute(interaction, client)
    {
        try {
        const days = Math.floor(client.uptime/86400000);
        const hours = Math.floor(client.uptime/3600000) % 24;
        const minutes = Math.floor(client.uptime/60000) % 60;
        const seconds = Math.floor(client.uptime/1000) % 60;

        cpustat.usagePercent(function(error, percent)
    {
        if (error) return interaction.reply({content: `${error}`});

        const node = process.version;
        const cpu = percent.toFixed(2);
        const joinedAt = client.user.createdAt;
        
        const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Bot Bilgileri')
        .addFields(
            {name: "Geliştirici", value: "Rio", inline: true},
            {name: "Kullanıcı Adı", value: `${client.user.username}`, inline: true},
            {name: "Kurulum tarihi", value: `> <t:${parseInt(joinedAt / 1000)}:R>`},
            {name: "Yardım Komutu", value: "> /help", inline: true},
            {name: "Çalışma Süresi", value: `\`${days}\` Gün, \`${hours}\` Saat, \`${minutes}\` dakika, \`${seconds}\` saniye`},
            {name: "Bot-Ping(ms)", value: `> ${client.ws.ping}ms`},
        )
        .setThumbnail(interaction.user.displayAvatarURL());
        
        interaction.reply({embeds: [embed]});
    });
} catch (error) {
    console.error('bot info komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'bot info komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}
    }
}