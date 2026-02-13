const { Collection, PermissionsBitField } = require('discord.js');

const cooldowns = new Collection();    
const messageCounts = new Collection();  

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const userId = message.author.id;
    const now = Date.now();
    const cooldownTime = 3000;
    const maxMessages = 6;

    if (!cooldowns.has(userId) || now - cooldowns.get(userId) > cooldownTime) {
      cooldowns.set(userId, now);
      messageCounts.set(userId, 1);
    } else {
      const cnt = (messageCounts.get(userId) || 0) + 1;
      messageCounts.set(userId, cnt);

      if (cnt >= maxMessages) {
        const me = message.guild.members.me;
        const canDelete = message.channel.permissionsFor(me)?.has(PermissionsBitField.Flags.ManageMessages);
        const canWarn   = message.channel.permissionsFor(me)?.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]);

        if (canDelete) {
          await message.delete().catch(() => {});
        }
        if (canWarn) {
          await message.channel.send(`${message.author}, lütfen spam yapma!`).catch(() => {});
        }

        cooldowns.set(userId, now);
        messageCounts.set(userId, 0);
      }
    }

    if (now % (5 * 60 * 1000) < 50) {
      for (const [id, ts] of cooldowns) {
        if (now - ts > 10 * 60 * 1000) {
          cooldowns.delete(id);
          messageCounts.delete(id);
        }
      }
    }
  },
};
