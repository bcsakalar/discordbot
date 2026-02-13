const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomfilm')
        .setDescription('Rastgele bir film önerir.'),
    async execute(interaction) {
        if (!TMDB_API_KEY) {
            console.error('TMDB_API_KEY ortam değişkeni ayarlanmamış.');
            return interaction.reply({
                content: 'TMDB API anahtarı ayarlanmamış. Lütfen bir yönetici ile iletişime geçin.',
                ephemeral: true,
            });
        }

        const randomPage = Math.floor(Math.random() * 500) + 1; // 1-500 arası rastgele bir sayfa seç
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&vote_average.gte=5&include_video=true&page=${randomPage}`;

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
                    ephemeral: true 
                });
            }

            const response = await axios.get(url);
            const movies = response.data.results.filter(movie => movie.vote_average > 5);
            const randomMovie = movies[Math.floor(Math.random() * movies.length)];

            // Fragman bulma (YouTube)
            const trailerUrl = `https://api.themoviedb.org/3/movie/${randomMovie.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
            const trailerResponse = await axios.get(trailerUrl);
            const trailers = trailerResponse.data.results;
            const trailer = trailers.find(vid => vid.type === "Trailer" && vid.site === "YouTube");

            const movieEmbed = {
                color: 0x0099ff,
                title: randomMovie.title,
                url: `https://www.themoviedb.org/movie/${randomMovie.id}`,
                description: randomMovie.overview || "Açıklama bulunmuyor.",
                fields: [
                    {
                        name: 'IMDB Puanı',
                        value: `${randomMovie.vote_average}`,
                        inline: true,
                    },
                    {
                        name: 'Yayın Tarihi',
                        value: `${randomMovie.release_date}`,
                        inline: true,
                    },
                    {
                        name: 'Fragman',
                        value: trailer ? `[Fragmanı İzle](https://www.youtube.com/watch?v=${trailer.key})` : "Fragman bulunamadı",
                        inline: false,
                    }
                ],
                image: {
                    url: `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`,
                },
            };

            await interaction.reply({ embeds: [movieEmbed] });
        } catch (error) {
        console.error('randomfilm komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'randomfilm komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    },
};
