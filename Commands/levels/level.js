const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Levels = require('discord.js-leveling');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Bir üyenin seviyesini ayarla (0 HARİÇ)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Bir üyeye seviye ekle')
                .addUserOption(option =>
                    option.setName('hedef')
                        .setDescription('Seviye eklenecek üyeyi seç')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Seviye miktarını seç')
                        .setMinValue(0)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Bir üyenin seviyesini düşür')
                .addUserOption(option =>
                    option.setName('hedef')
                        .setDescription('Seviye düşürülecek üyeyi seç')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Seviye miktarını seç')
                        .setMinValue(0)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Bir üyenin seviyesini ayarla')
                .addUserOption(option =>
                    option.setName('hedef')
                        .setDescription('Seviye düşürülecek üyeyi seç')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Seviye miktarını seç')
                        .setMinValue(0)
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            // Yanıtı bekletmek
            await interaction.deferReply({ ephemeral: true });

            // Sunucu ayarlarını al
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.levels_channel;

            if (!allowedChannelId) {
                return interaction.editReply({ content: "Levels kanalı ayarlanmamış. Lütfen bir kanal ayarlayın." });
            }

            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.editReply({
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Level"}** kanalı olarak ayarlanan kanalda kullanınız.**`
                });
            }

            const { options, guildId } = interaction;

            const sub = options.getSubcommand();
            const target = options.getUser('hedef');
            const amount = options.getInteger('amount');
            const embed = new EmbedBuilder();

            switch (sub) {
                case 'add':
                    await Levels.appendLevel(target.id, guildId, amount);
                    embed.setDescription(`${target} adlı üyeye ${amount} seviye eklendi!`).setColor('Green').setTimestamp();
                    break;
                case 'remove':
                    await Levels.subtractLevel(target.id, guildId, amount);
                    embed.setDescription(`${target} adlı üyeden ${amount} seviye düşürüldü!`).setColor('Red').setTimestamp();
                    break;
                case 'set':
                    await Levels.setLevel(target.id, guildId, amount);
                    embed.setDescription(`${target} adlı üyenin seviyesi ${amount} seviye ayarlandı!`).setColor('Yellow').setTimestamp();
                    break;
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Level komutu sırasında bir hata oluştu:', error);
            await interaction.editReply({
                content: 'Level komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
            });
        }
    }
}
