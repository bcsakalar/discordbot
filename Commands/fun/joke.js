const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('şaka')
        .setDescription('Rastgele bir şaka veya belirli bir kategoriden şaka gösterir')
        .addStringOption(option =>
            option.setName('tür')
                .setDescription('Şaka türünü seçin')
                .setRequired(false)
                .addChoices(
                    { name: 'Genel Rastgele Şaka', value: 'random' },
                    { name: 'Programlama', value: 'Programming' },
                    { name: 'Karışık', value: 'Miscellaneous' },
                    { name: 'Karanlık', value: 'Dark' },
                    { name: 'PUN', value: 'Pun' },
                    { name: 'Müstehcen', value: 'Spooky' },
                    { name: 'Hıristiyan', value: 'Christmas' }
                )
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

        const tür = interaction.options.getString('tür') || 'random';

        try {
            let joke;
            if (tür === 'random') {
                // `icanhazdadjoke` API'den rastgele bir şaka al
                const url = 'https://icanhazdadjoke.com/';
                const response = await axios.get(url, {
                    headers: { 'Accept': 'application/json' }
                });
                joke = response.data.joke;
            } else {
                // `JokeAPI` API'sinden belirli kategoride bir şaka al
                const url = `https://v2.jokeapi.dev/joke/${tür}?type=single`;
                const response = await axios.get(url);
                joke = response.data.joke;
            }

            await interaction.reply({ content: joke });
        } catch (error) {
            console.error(error);
            await interaction.reply('Şaka alınırken bir hata oluştu.');
        }
    } catch (error) {
        console.error('joke komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'joke komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    },
};
