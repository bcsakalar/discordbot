const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const ServerSettings = require('../../Models/ServerSettings');

const slaps = [
    "https://i.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
    "https://i.giphy.com/media/mEtSQlxqBtWWA/giphy.gif",
    "https://i.giphy.com/media/j3iGKfXRKlLqw/giphy.gif",
    "https://i.giphy.com/media/2M2RtPm8T2kOQ/giphy.gif",
    "https://i.giphy.com/media/l3YSimA8CV1k41b1u/giphy.gif",
    "https://i.giphy.com/media/WLXO8OZmq0JK8/giphy.gif",
    "https://media1.tenor.com/images/0720ffb69ab479d3a00f2d4ac7e0510c/tenor.gif",
    "https://media1.tenor.com/images/8b80166ce48c9c198951361715a90696/tenor.gif",
    "https://media1.tenor.com/images/6aa432caad8e3272d21a68ead3629853/tenor.gif",
    "https://media1.tenor.com/images/4ec47d7b87a9ce093642fc8a3c2969e7/tenor.gif"
];
module.exports = {
    data: new SlashCommandBuilder()
        .setName("tokat")
        .setDescription("Birine tokat at")
        .addUserOption(option =>
            option.setName("hedef")
                .setDescription("Kim tokat ister")
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.fun_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Eğlence kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Eğlence"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const { options, member } = interaction

        const user = options.getUser("hedef");

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Random")
                    .setImage(slaps[Math.floor(Math.random() * slaps.length)])
                    .setDescription(
                        `${member} kullanıcısı ${user} Tokatladı!!!`
                    )
            ]
        });
    } catch (error) {
        console.error('slap komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'slap komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
}