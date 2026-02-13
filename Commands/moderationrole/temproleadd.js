const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require('discord.js');
const tempRoleSchema = require('../../Models/RoleAdd');
const scheduleRoleRemove = require('../../Functions/scheduleRoleRemove');
const ServerSettings = require('../../Models/ServerSettings');

function formatTimeStamp(date)
{
    const unixTimeStamp = Math.floor(date.getTime() / 1000);
    return `<t:${unixTimeStamp}:R>`
}

module.exports = 
{
    data: new SlashCommandBuilder()
   .setName('geçicirolekle')
   .setDescription('Geçici bir rolü, bir üyeye ata')
   .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
   .addUserOption(option => 
    option.setName('user')
    .setDescription('Rol eklenecek üye')
    .setRequired(true)
   )
   .addRoleOption(option => 
    option.setName('role')
    .setDescription('üyeye eklenecek rol')
    .setRequired(true)
   )
   .addIntegerOption(option => 
    option.setName('duration')
    .setDescription('dakika')
    .setRequired(true)
   )
   .addBooleanOption(option => 
    option.setName('dm')
    .setDescription('Üyeye geçici rol hakkında DM gönderilsin mi? ')
    .setRequired(false)
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

    try{
        const {options, guild} = interaction;
        const user = options.getUser('user');
        const role = options.getRole('role');
        const duration = options.getInteger('duration');
        const dm = options.getBoolean('dm') || false;
        const member = await guild.members.fetch(user.id);
        const expiresAt = new Date(Date.now() + duration * 60000);

        const memberRolePosition = guild.members.cache.get(interaction.user.id).roles.highest.position;
        const rolePosition = role.position;

        if (rolePosition >= memberRolePosition) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setDescription(`\`${role.name}\` rolünü yönetme izniniz yok.`)
                .setAuthor({
                    name: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setFooter({ text: `Requested By ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if(member.roles.cache.has(role.id))
            {
                const embed = new EmbedBuilder()
                .setColor('DarkGreen')
                .setDescription(`${user} üyesi zaten \`${role.name}\` rolüne sahip.`)
                .setAuthor({
                    name: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setFooter({text: `Requested By ${interaction.user.tag}`})
                .setTimestamp()

                await interaction.reply({embeds: [embed], ephemeral: true});
                return;
            }

            if (role.permissions.has(PermissionFlagsBits.Administrator)) {
                const embed = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setDescription(`\`${role.name}\` rolü yönetici yetkilerine sahip olduğundan verilemez.`)
                    .setAuthor({
                        name: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setFooter({ text: `Requested By ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            await interaction.guild.members.cache.get(user.id).roles.add(role);

            const tempRole = new tempRoleSchema({
                GuildId: guild.id,
                UserId: user.id,
                RoleId: role.id,
                duration: duration,
                expiresAt,
            });

            await tempRole.save();

            scheduleRoleRemove(interaction.client, user.id, role.id, guild.id, expiresAt, duration);

                if(dm)
                    {
                        const timestamp = formatTimeStamp(expiresAt);
                        const message = `${guild.name} sunucusunda ${duration} dakikalığına geçici olarak \`${role.name}\` rolüne atandınız`
                        try{
                            await user.send(message);
                        }
                        catch
                        {
                            await interaction.reply({content: `${user.id} üyesine DM gönderilirken bir sorun olştu. DM'leri kapalı olabilir: ${err}`})
                        }
                    }

                    const timestamp = formatTimeStamp(expiresAt);

                    const embed = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setDescription(`\`${role.name}\` rolü ${duration} dakikalığına ${user.toString()} üyesine eklenmiştir. ${timestamp} kaldırılacaktır.`)
                    .setAuthor({
                        name: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setFooter({text: `Requested By ${interaction.user.tag}`})
                    .setTimestamp()

                    await interaction.reply({embeds: [embed], ephemeral: true});
                }
                catch(err)
                {
                    console.log(err);
                }
            } catch (error) {
                console.error('temproleadd komutu sırasında bir hata oluştu:', error);
                await interaction.reply({
                    content: 'temproleadd komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                    ephemeral: true
                });
            }

        }
   }