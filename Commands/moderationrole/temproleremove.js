const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require('discord.js');
const tempRoleSchema = require('../../Models/RoleRemove');
const scheduleRoleAdd = require('../../Functions/scheduleRoleAdd');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
   .setName('geçicirolkaldır')
   .setDescription('Geçici bir rolü, bir üyeden çıkar')
   .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
   .addUserOption(option => 
    option.setName('user')
    .setDescription('Rol çıkarılacak üye')
    .setRequired(true)
   )
   .addRoleOption(option => 
    option.setName('role')
    .setDescription('üyeden çıkarılacak rol')
    .setRequired(true)
   )
   .addIntegerOption(option => 
    option.setName('duration')
    .setDescription('dakika')
    .setRequired(true)
   ),

   async execute(interaction)
   {
    try {
        // Fetch server settings to get the allowed game channel ID
        const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
        const allowedChannelId = serverSettings?.moderation_channel;

        if (!allowedChannelId) {
            return interaction.reply({ content: "Modearasyon kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
        }

        if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            return interaction.reply({ 
                content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Moderasyon"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                ephemeral: true 
            });
        }

        const {options, guild} = interaction;
        const user = options.getUser('user');
        const role = options.getRole('role');
        const duration = options.getInteger('duration');
        const member = await guild.members.fetch(user.id);
        const expiresAt = new Date(Date.now() + duration * 60000);

        if(!member.roles.cache.has(role.id))
        {
            const embed = new EmbedBuilder()
            .setColor('DarkGreen')
            .setDescription(`${user} üyesi zaten \`${role.name}\` rolüne sahip değil.`)
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setFooter({text: `Requested By ${interaction.user.tag}`})
            .setTimestamp()

            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }

        await interaction.guild.members.cache.get(user.id).roles.remove(role);

        const tempRole = new tempRoleSchema({
            GuildId: guild.id,
            UserId: user.id,
            RoleId: role.id,
            duration: duration,
            expiresAt,
        });

        await tempRole.save();

        scheduleRoleAdd(interaction.client, user.id, role.id, guild.id, expiresAt, duration);

        const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);
        const timestamp = `<t:${expiresAtUnix}:R>`

        const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setDescription(`\`${role.name}\` rolü ${duration} dakikalığına ${user.toString()} üyesinden çıkarılmıştır. ${timestamp} geri eklenecektir.`)
        .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({text: `Requested By ${interaction.user.tag}`})
        .setTimestamp()

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('temproleremove komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'temproleremove komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
}