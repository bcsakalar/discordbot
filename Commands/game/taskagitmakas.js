const { RockPaperScissors } = require('discord-gamecord');
const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName('taş-kağıt-makas')
    .setDescription('taş kağıt makas oyunu')
    .addUserOption(option =>
        option.setName('rakip')
        .setDescription('taş, kağıt, makas')
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
            .setTitle('taş kağıt makas')
            .setDescription('taş kağıt makas oyununu oynarken iyi eğlenceler!')
            .setColor('#5865F2');

            await interaction.reply({ embeds: [embed] });

            const Game = new RockPaperScissors({
                message: interaction,
                isSlashGame: true,
                opponent: interaction.options.getUser('rakip'),
                embed: {
                  title: 'Taş Kağıt Makas',
                  color: '#5865F2',
                  description: 'Seçimizi yapmak için bir butona basınız',
                  requestTitle: 'Oyun isteği',
                    requestColor: '#57F287',
                    rejectTitle: 'Oyunu iptal et',
                    rejectColor: '#ED4245'
                },
                buttons: {
                  rock: 'Taş',
                  paper: 'Kağıt',
                  scissors: 'Makas',
                  accept: 'Kabul Et',
                  reject: 'Reddet'
                },
                emojis: {
                  rock: '🪨',
                  paper: '📰',
                  scissors: '✂️'
                },
                mentionUser: true,
                timeoutTime: 60000,
                reqTimeoutTime: 30000,
                requestMessage: '{player} Seni Oyuna Davet Ediyor',
                rejectMessage: '{opponent} Oyunu Reddetti',
                reqTimeoutMessage: '{opponent} oyuna cevap vermediği için, oyun kendini imha etti.',
                buttonStyle: 'PRIMARY',
                pickMessage: 'Bunu {emoji}.',
                winMessage: 'Oyunu Kazanan **{player}** Tebrikler!',
                loseMessage: 'bunda da yenilmezsin **{player}** Eşşek',
                tieMessage: 'Oyun Berabere! Kazanan Yok! Belli ki oyunu iki **cenabet** oynamış!',
                timeoutMessage: 'Oyun daha bitmedi! kazanan yok!',
                playerOnlyMessage: 'sadece {player} ve {opponent} butonları kullanabilir.'
              });
              
              Game.startGame();
              Game.on('Oyun Bitti', result => {
                console.log(result);  // =>  { result... }
              });

            } catch (error) {
              console.error('taş kağıt makas oyunu sırasında bir hata oluştu:', error);
              await interaction.reply({
                  content: 'taş kağıt makas oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                  ephemeral: true
              });
          }
    }
}