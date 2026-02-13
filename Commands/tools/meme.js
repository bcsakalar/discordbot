const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Rastgele bir meme gönderir'),
    async execute(interaction) {
        try {
            // Imgflip API'sinden rastgele meme çek
            const response = await axios.get('https://api.imgflip.com/get_memes');
            const memes = response.data.data.memes;

            // Rastgele bir meme seç
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];

            // Meme embed tasarımı
            const memeEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(randomMeme.name)
                .setImage(randomMeme.url)
                .setFooter({ text: 'Imgflip tarafından sağlanmaktadır', iconURL: 'https://imgflip.com/favicon.ico' })
                .setTimestamp();

            await interaction.reply({ embeds: [memeEmbed] });
        } catch (error) {
            console.error('Meme komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'Meme çekilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    },
};
