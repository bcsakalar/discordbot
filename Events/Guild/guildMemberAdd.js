const { EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const Schema = require('../../Models/Welcome');
const { profileImage } = require('discord-arts');

async function tryGiveRole(member, roleId) {
  const guild = member.guild;
  const me = guild.members.me;

  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) return 'role_not_found';
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return 'no_perm';
  if (role.position >= me.roles.highest.position) return 'hierarchy';

  try {
    await member.roles.add(role);
    return 'ok';
  } catch (e) {
    console.error('welcome role add error:', {
      code: e.code, status: e.status, message: e.rawError?.message,
      myTop: member.guild.members.me.roles.highest.position,
      roleTop: role.position, managed: role.managed
    });
    return 'add_failed';
  }
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const data = await Schema.findOne({ Guild: member.guild.id });
      if (!data) return;

      const channel = member.guild.channels.cache.get(data.Channel);
      const msgText = data.Msg || ' ';
      const roleId = (data.Role || '').toString().replace(/[<@&>]/g, '');

      const me = member.guild.members.me;
      const canSend = channel?.permissionsFor(me)?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.AttachFiles
      ]);

      if (channel && canSend) {
        const buf = await profileImage(member.id).catch(() => null);
        const files = buf ? [new AttachmentBuilder(buf, { name: 'profile.png' })] : [];
        const embed = new EmbedBuilder()
          .setTitle('**🌞 Sunucumuza Katılan Biri Daha 🌞**')
          .setDescription(msgText + `${member}`)
          .setColor(0x037821)
          .addFields({ name: 'Toplam Üye', value: `${member.guild.memberCount}`, inline: true })
          .setTimestamp();
        if (buf) embed.setImage('attachment://profile.png');

        await channel.send({ embeds: [embed], files }).catch(() => {});
      }

      if (roleId) {
        if (member.pending) {
          member.client.pendingWelcome ??= new Map();
          member.client.pendingWelcome.set(member.id, { guildId: member.guild.id, roleId });
          setTimeout(async () => {
            if (!member.pending) await tryGiveRole(member, roleId);
          }, 10_000).unref?.();
        } else {
          const res = await tryGiveRole(member, roleId);
          if (res !== 'ok') {
            console.warn('Welcome role verilemedi, yukarıdaki logu kontrol et.');
          }
        }
      }
    } catch (e) {
      console.error('welcome add error:', e);
    }
  }
};
