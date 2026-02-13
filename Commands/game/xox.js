const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { TicTacToe } = require('discord-gamecord');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
       .setName('xox')
       .setDescription('XOX oyunu')
       .addUserOption(option =>
        option.setName('rakip')
        .setDescription('xox oyunu')
        .setRequired(true)
    ),
    
    async execute (interaction)
    {
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

        const {options} = interaction;

        const embed = new EmbedBuilder()
            .setTitle('XOX')
            .setDescription('XOX oyununu oynarken iyi eğlenceler!')
            .setColor('#5865F2');

            await interaction.reply({ embeds: [embed] });

            const Game = new TicTacToe({
            message: interaction,
            isSlashGame: true,
            opponent: interaction.options.getUser('rakip'),
            embed: {
                title: 'XOX',
                color: '#5865F2',
                statusTitle: 'Durum',
                overTitle: 'Oyun Bitti'
            },
            emojis: {
                xButton: '❌',
                oButton: '🔵',
                blankButton: '➖'
            },
            mentionUser: true,
            timeoutTime: 60000,
            xButtonStyle: 'DANGER',
            oButtonStyle: 'PRIMARY',
            turnMessage: '{emoji} | Oyuncunun sırası **{player}**.',
            winMessage: '{emoji} | **{player}** XOX Oyununu kazandı.',
            tieMessage: 'Oyun berabere kaldı! Oyunu Kazanan Kimse Yok!',
            timeoutMessage: 'Oyun yarım kaldı! Oyunu Kazanan Kimse Yok!',
            playerOnlyMessage: 'Bu butonları yalnızca {player} ve {opponent} kullanabilir.'
            });

            Game.startGame();
            Game.on('gameOver', result => {
            console.log(result);  // =>  { result... }
            });
        } catch (error) {
            console.error('xox oyunu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'xox oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    } 
}