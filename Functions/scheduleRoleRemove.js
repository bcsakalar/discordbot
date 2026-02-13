const tempRoleSchema = require('../Models/RoleRemove');
const { PermissionsBitField } = require('discord.js');

const MAX_TIMEOUT = 2_147_483_647;

async function safeGetGuild(client, guildId) {
  return client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
}

async function safeGetMember(guild, userId) {
  return guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
}

function scheduleRoleRemove(client, UserId, RoleId, GuildId, ExpiresAt) {
  const run = async () => {
    const guild = await safeGetGuild(client, GuildId);
    if (!guild) return;

    const member = await safeGetMember(guild, UserId);
    const role = guild.roles.cache.get(RoleId) || await guild.roles.fetch(RoleId).catch(() => null);

    if (member && role) {
      const me = guild.members.me;
      const canManage = me.permissions.has(PermissionsBitField.Flags.ManageRoles);
      const hierarchyOK = role.position < me.roles.highest.position;

      if (canManage && hierarchyOK && member.roles.cache.has(RoleId)) {
        await member.roles.remove(RoleId, 'Zamanlanmış: rol kaldırma zamanı geldi').catch(() => {});
      }
    }

    await tempRoleSchema.deleteOne({ GuildId: GuildId, UserId: UserId, RoleId: RoleId }).catch(() => {});
  };

  const delay = ExpiresAt.getTime() - Date.now();
  if (delay <= 0) {
    run();
    return;
  }
  if (delay > MAX_TIMEOUT) {
    setTimeout(() => scheduleRoleRemove(client, UserId, RoleId, GuildId, ExpiresAt), MAX_TIMEOUT).unref?.();
    return;
  }
  setTimeout(run, delay).unref?.();
}

module.exports = scheduleRoleRemove;
