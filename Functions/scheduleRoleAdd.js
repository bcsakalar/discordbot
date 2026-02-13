const tempRoleSchema = require('../Models/RoleAdd');
const { PermissionsBitField } = require('discord.js');

const MAX_TIMEOUT = 2_147_483_647;

async function safeGetGuild(client, guildId) {
  return client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
}

async function safeGetMember(guild, userId) {
  return guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
}

function scheduleRoleAdd(client, UserId, RoleId, GuildId, ExpiresAt) {
  const run = async () => {
    const guild = await safeGetGuild(client, GuildId);
    if (!guild) return;

    const member = await safeGetMember(guild, UserId);
    if (!member) {
      await tempRoleSchema.findOneAndDelete({ GuildId, UserId, RoleId }).catch(() => {});
      return;
    }

    const me = guild.members.me;
    const role = guild.roles.cache.get(RoleId) || await guild.roles.fetch(RoleId).catch(() => null);
    if (!role) {
      await tempRoleSchema.findOneAndDelete({ GuildId, UserId, RoleId }).catch(() => {});
      return;
    }

    const canManage = me.permissions.has(PermissionsBitField.Flags.ManageRoles);
    const hierarchyOK = role.position < me.roles.highest.position;
    if (canManage && hierarchyOK) {
      await member.roles.add(role, 'Zamanlanmış: rol ekleme zamanı geldi').catch(() => {});
    }

    await tempRoleSchema.findOneAndDelete({ GuildId, UserId, RoleId }).catch(() => {});
  };

  const delay = ExpiresAt.getTime() - Date.now();
  if (delay <= 0) {
    run(); 
    return;
  }
  if (delay > MAX_TIMEOUT) {
    setTimeout(() => scheduleRoleAdd(client, UserId, RoleId, GuildId, ExpiresAt), MAX_TIMEOUT).unref?.();
    return;
  }
  setTimeout(run, delay).unref?.();
}

module.exports = scheduleRoleAdd;
