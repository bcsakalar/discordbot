const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Levels = require('discord.js-leveling');
const LevelRole = require('../../Models/LevelRoles');

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if ((message.content?.trim() || "").length < 3) return;

    // XP
    const randomXP = Math.floor(Math.random() * 24) + 1;
    const leveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomXP);

    if (!leveledUp) return;

    const user = await Levels.fetch(message.author.id, message.guild.id).catch(() => null);
    if (!user) return;

    const doc = await LevelRole.findOne({ guildId: message.guild.id });
    if (doc && doc.levelRoles?.has(user.level.toString())) {
      const roleId = doc.levelRoles.get(user.level.toString());
      const role = message.guild.roles.cache.get(roleId);

      const me = message.guild.members.me;
      if (
        role &&
        me.permissions.has(PermissionsBitField.Flags.ManageRoles) &&
        role.position < me.roles.highest.position
      ) {
        await message.member.roles.add(role).catch(() => {});
      }
    }

    // ---- Mesaj & izinler ----
    const me = message.guild.members.me;
    const canSend = message.channel
      .permissionsFor(me)
      ?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.AddReactions
      ]);

    if (canSend) {
      const levelEmbed = new EmbedBuilder()
        .setTitle("Yeni Seviye! 🎉")
        .setDescription(`**GG** ${message.author}, **${user.level}** seviyesine yükseldi!`)
        .setColor(0x5865F2)
        .setTimestamp();

      const sent = await message.channel.send({ embeds: [levelEmbed] }).catch(() => null);
      if (sent) sent.react('✨').catch(() => {});
    }
  }
};
