const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Client, AttachmentBuilder } = require('discord.js');
const Levels = require('discord.js-leveling');
const { profileImage } = require('discord-arts');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Birinin seviyesi hakkında bilgi al')
        .addUserOption(option =>
            option.setName('user').setDescription("Bir üye seç").setRequired(false)
        ),

    async execute(interaction, client) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.levels_channel;

            if (!allowedChannelId) {
                return interaction.reply({ content: "Levels kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }

            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Level"}** kanalı olarak ayarlanan kanalda kullanınız.**`,
                    ephemeral: true
                });
            }

            const { options, guildId, user } = interaction;
            const member = options.getMember("user") || user;

            await interaction.deferReply();

            const levelUser = await Levels.fetch(member.id, guildId);
            const embed = new EmbedBuilder();

            if (!levelUser) {
                return interaction.followUp({ content: 'Görünüşe göre bu üye hiç XP kazanmamış', ephemeral: true });
            }

            var xpRequired = levelUser.level > 0 ? Levels.xpFor(levelUser.level + 1) : 0;

            const rawLeaderboard = await Levels.fetchLeaderboard(guildId, 10);
            const leaderboard = await Levels.computeLeaderboard(client, rawLeaderboard, true);

            const buffer = await profileImage(member.id, {
                borderColor: ['#000000', '#ffffff'],
                badgesFrame: true,
                usernameColor: '#ffffff',
                customBackground: '',
                squareAvatar: true,
                rankData: {
                    currentXp: levelUser.xp,
                    requiredXp: xpRequired,
                    level: levelUser.level,
                    barColor: "#0aa7f0",
                }
            });

            const img = new AttachmentBuilder(buffer, { name: 'rank.png' });

            return interaction.followUp({ files: [img] });

        } catch (error) {
            console.error('rank komutu sırasında bir hata oluştu:', error);

            if (interaction.deferred) {
                await interaction.followUp({
                    content: 'rank komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'rank komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                    ephemeral: true
                });
            }
        }
    }
};
