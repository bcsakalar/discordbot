const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomdizi')
        .setDescription('Rastgele bir dizi önerir.'),
    async execute(interaction) {
        if (!TMDB_API_KEY) {
            console.error('TMDB_API_KEY ortam değişkeni ayarlanmamış.');
            return interaction.reply({
                content: 'TMDB API anahtarı ayarlanmamış. Lütfen bir yönetici ile iletişime geçin.',
                ephemeral: true,
            });
        }

        const randomPage = Math.floor(Math.random() * 500) + 1;
        const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&vote_average.gte=5&page=${randomPage}`;

        try {
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.tools_channel;

            if (!allowedChannelId) {
                return interaction.reply({ content: "Araçlar kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }

            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Araçlar"}** kanalı olarak ayarlanan kanalda kullanınız.**`,
                    ephemeral: true,
                });
            }

            const response = await axios.get(url);
            const series = response.data.results.filter(serie => serie.vote_average > 5);
            const randomSerie = series[Math.floor(Math.random() * series.length)];

            const detailsUrl = `https://api.themoviedb.org/3/tv/${randomSerie.id}?api_key=${TMDB_API_KEY}&language=tr-TR`;
            const detailsResponse = await axios.get(detailsUrl);
            const details = detailsResponse.data;

            const serieEmbed = {
                color: 0x0099ff,
                title: randomSerie.name,
                url: `https://www.themoviedb.org/tv/${randomSerie.id}`,
                description: randomSerie.overview || "Açıklama bulunmuyor.",
                fields: [
                    {
                        name: 'IMDB Puanı',
                        value: `${randomSerie.vote_average}`,
                        inline: true,
                    },
                    {
                        name: 'Yayın Tarihi',
                        value: `${randomSerie.first_air_date}`,
                        inline: true,
                    },
                    {
                        name: 'Sezon Sayısı',
                        value: `${details.number_of_seasons}`,
                        inline: true,
                    },
                    {
                        name: 'Toplam Bölüm Sayısı',
                        value: `${details.number_of_episodes}`,
                        inline: true,
                    },
                ],
                image: {
                    url: `https://image.tmdb.org/t/p/w500${randomSerie.poster_path}`,
                },
            };

            await interaction.reply({ embeds: [serieEmbed] });
        } catch (error) {
            console.error('randomdizi komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'randomdizi komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true,
            });
        }
    },
};
