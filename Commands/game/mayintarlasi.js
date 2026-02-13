const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Minesweeper } = require('discord-gamecord');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mayıntarlası')
        .setDescription('Mayın Tarlası Oyunu'),
    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.game_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Oyun kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Oyun"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        // Bir EmbedBuilder kullanarak bir embed oluşturun
        const embed = new EmbedBuilder()
            .setTitle('Mayın Tarlası Oyunu')
            .setDescription('Mayınlar dışındaki blokları ortaya çıkarmak için butonlara tıklayın.')
            .setColor('#5865F2');

        // Mesajı interaction aracılığıyla gönderin
        await interaction.reply({ embeds: [embed] });

        // Minesweeper oyununu başlatın
        const Game = new Minesweeper({
            message: interaction,
            isSlashGame: true, // isSlashGame değerini true olarak ayarlayın
            embed: {
                title: 'Mayın Tarlası',
                color: '#5865F2',
                description: 'Mayınlar dışındaki blokları ortaya çıkarmak için butonlara tıklayın.'
            },
            emojis: { flag: '🚩', mine: '💣' },
            mines: 5,
            timeoutTime: 60000,
            winMessage: 'Oyunu kazandın! Tüm mayınlardan başarıyla kaçındınız.',
            loseMessage: 'Oyunu kaybettin! Bir dahaki sefere mayınlara dikkat edin.',
            playerOnlyMessage: 'Bu düğmeleri yalnızca {player} kullanabilir.'
        });

        Game.startGame();
        Game.on('gameOver', result => {
            let gameOverEmbed;
            if (result.result === 'win') {
                gameOverEmbed = new EmbedBuilder()
                    .setTitle('Oyun Bitti')
                    .setDescription(`${interaction.user.username}, oyunu kazandın! Tüm mayınlardan başarıyla kaçındınız.`)
                    .setColor('#00FF00') // Yeşil renk
                    .setThumbnail(interaction.user.displayAvatarURL());
            } else {
                gameOverEmbed = new EmbedBuilder()
                    .setTitle('Oyun Bitti')
                    .setDescription(`${interaction.user.username}, oyunu kaybettin! Bir dahaki sefere mayınlara dikkat edin.`)
                    .setColor('#FF0000') // Kırmızı renk
                    .setThumbnail(interaction.user.displayAvatarURL());
            }

            interaction.followUp({ embeds: [gameOverEmbed] });
        });
    } catch (error) {
        console.error('mayın tarlası oyunu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'mayın tarlası oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
}
