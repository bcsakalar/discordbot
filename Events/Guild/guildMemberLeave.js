const { EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const Schema = require('../../Models/Leave');
const { profileImage } = require('discord-arts');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const data = await Schema.findOne({ Guild: member.guild.id });
      if (!data) return;

      const channel = member.guild.channels.cache.get(data.Channel);
      const me = member.guild.members.me;

      const canSend = channel && channel.permissionsFor(me)?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
      ]);
      if (!channel || !canSend) return;

      const buf = await profileImage(member.id).catch(()=>null);
      const files = buf ? [new AttachmentBuilder(buf, { name: 'profile.png' })] : [];

      const embed = new EmbedBuilder()
        .setTitle("**😞 Aramızdan Bir Kişi Daha Kaybettik 😞**")
        .setDescription((data.Message || " ") + `${member.user.tag}`)
        .setColor(0xFF0000)
        .addFields({ name: 'Sunucu Üye Sayısı', value: `${member.guild.memberCount}`, inline: true })
        .setTimestamp();
      if (buf) embed.setImage("attachment://profile.png");

      await channel.send({ embeds: [embed], files }).catch(()=>{});
    } catch (e) {
      console.error('goodbye error:', e);
    }
  }
};
