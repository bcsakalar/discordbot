const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timezone")
        .setDescription('Farklı bölgelerdeki güncel saatleri gösterir')
        .addStringOption(option => 
            option.setName('timezone')
                .setDescription('Güncel saatleri gösterecek bölge')
                .setRequired(true)
                .addChoices(
                    { name: "İstanbul", value: "Europe/Istanbul" },
                    { name: "Los Angeles", value: "America/Los_Angeles" },
                    { name: "New York", value: "America/New_York" },
                    { name: "Berlin", value: "Europe/Berlin"},
                    { name: "Japan", value: "Asia/Tokyo"},
                    { name: "London", value: "Europe/London"},
                    { name: "Australia", value: "Australia/Sydney"},
                    { name: "China", value: "Asia/Shanghai"},
                    { name: "Brazil", value: "America/Sao_Paulo"},
                    { name: "Johannesburg", value: "Africa/Johannesburg"},
                    { name: "Moscow", value: "Europe/Moscow"},
                    { name: "Dubai", value: "Asia/Dubai"},
                    { name: "Singapore", value: "Asia/Singapore"},
                    { name: "Hong Kong", value: "Asia/Hong_Kong"},
                    { name: "Korea", value: "Asia/Seoul"},
                    { name: "Central Pacific", value: "Pacific/Fiji"},
                )
        ),
    
    async execute(interaction) {
        try {

        await interaction.deferReply({ ephemeral: true });

        const timezone = interaction.options.getString("timezone");

        const currentDate = neDatew ();
        const options = { timeZone: timezone, hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' };
        const localTime = currentDate.toLocaleTimeString('en-US', options);

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setDescription(`${timezone} ➡️ ${localTime}`);

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('timezone komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'timezone komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
};