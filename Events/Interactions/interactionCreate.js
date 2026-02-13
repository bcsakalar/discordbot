const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    const { customId, values, guild, member } = interaction;

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction, client);
    }

    if (interaction.isStringSelectMenu() && customId === "roller") {
      const me = guild.members.me;

      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: "Rol yönetme iznim yok.", ephemeral: true });
      }

      for (const roleId of values) {
        const role = guild.roles.cache.get(roleId);
        if (!role) continue;

        if (role.position >= me.roles.highest.position) {
          continue; 
        }

        const hasRole = member.roles.cache.has(roleId);
        if (hasRole) await member.roles.remove(roleId).catch(()=>{});
        else await member.roles.add(roleId).catch(()=>{});
      }

      return interaction.reply({ content: "Roller güncellendi.", ephemeral: true });
    }
  },
};
