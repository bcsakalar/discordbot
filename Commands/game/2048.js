const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { TwoZeroFourEight } = require('discord-gamecord');
const ServerSettings = require('../../Models/ServerSettings');

module.exports =
{
    data: new SlashCommandBuilder()
    .setName('2048')
    .setDescription('2048 oyunu'),

    async execute(interaction)
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

        const Game = new TwoZeroFourEight({
            message: interaction,
            isSlashGame: true,
            embed: {
              title: '2048',
              color: '#5865F2'
            },
            emojis: {
              up: '⬆️',
              down: '⬇️',
              left: '⬅️',
              right: '➡️',
            },
            timeoutTime: 60000,
            buttonStyle: 'PRIMARY',
            playerOnlyMessage: 'Only {player} can use these buttons.'
          });
          
          Game.startGame();
          Game.on('gameOver', result => {
            console.log(result);  // =>  { result... }
          });

        } catch (error) {
          console.error('2048 oyunu sırasında bir hata oluştu:', error);
          await interaction.reply({
              content: '2048 oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
              ephemeral: true
          });
      }

    }
}
