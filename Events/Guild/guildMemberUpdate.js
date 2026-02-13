const { PermissionsBitField } = require('discord.js');
const Welcome = require('../../Models/Welcome');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    try {
      if (oldMember.pending && !newMember.pending) {
        const data = await Welcome.findOne({ Guild: newMember.guild.id });
        if (!data?.Role) return;

        const roleId = data.Role.toString().replace(/[<@&>]/g, '');
        const role = await newMember.guild.roles.fetch(roleId).catch(() => null);
        const me = newMember.guild.members.me;

        if (!role) return;
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;
        if (role.managed || role.position >= me.roles.highest.position) return;

        await newMember.roles.add(role).catch(e =>
          console.error('welcome update add error:', e.code, e.rawError?.message)
        );
      }
    } catch (e) {
      console.error('guildMemberUpdate error:', e);
    }
  }
};
