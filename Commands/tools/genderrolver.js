const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const MessageModel = require('../../Models/GenderRoles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genderrolver')
    .setDescription('Ladies ve Gentlemen rolleri atamak için emojiye tıklayın.')
    .addChannelOption(o => o.setName('kanal').setDescription('Mesajın gönderileceği kanal.').setRequired(true))
    .addRoleOption(o => o.setName('gentlemenrolu').setDescription('Gentlemen rolü').setRequired(true))
    .addRoleOption(o => o.setName('ladiesrolu').setDescription('Ladies rolü').setRequired(true)),

  async execute(interaction) {
    const allowedUserIds = ['323975996829073418'];
    if (!allowedUserIds.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Bu komut özel, iznin yok.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.options.getChannel('kanal');
      const gentlemenRole = interaction.options.getRole('gentlemenrolu');
      const ladiesRole = interaction.options.getRole('ladiesrolu');

      const me = interaction.guild.members.me;

      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply({ content: 'Rolleri yönetme iznim yok (Manage Roles).' });
      }
      const needed = [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages,   // << EKLENDİ
      ];
      if (!channel.permissionsFor(me).has(needed)) {
        return interaction.editReply({ content: 'Kanalda izinlerim eksik (View/Send/AddReactions/ReadHistory/**ManageMessages**).' });
      }

      const myTop = me.roles.highest.position;
      if (ladiesRole.position >= myTop || gentlemenRole.position >= myTop) {
        return interaction.editReply({ content: 'Bot rolün, atayacağın rollerden **üstte** olmalı.' });
      }

      const message = await channel.send({
        content: 'Gentlemen için 🎩, Ladies için 👠 emojisine tıklayın.'
      });
      await message.react('🎩');
      await message.react('👠');

      await MessageModel.create({
        messageId: message.id,
        channelId: channel.id,
        guildId: interaction.guild.id,
        gentlemenRoleId: gentlemenRole.id,
        ladiesRoleId: ladiesRole.id
      });

      setupReactionCollector(message, ladiesRole, gentlemenRole);

      await interaction.editReply({ content: 'Tamam! Mesaj gönderildi, kolektör kuruldu ve süresiz aktif.' });
    } catch (err) {
      console.error('genderrolver execute error:', err);
      await interaction.editReply({ content: 'Bir hata oluştu. Loglara baktım.' });
    }
  },

  restoreGenderCollector
};

// --- Kolektör ---
function setupReactionCollector(message, ladiesRole, gentlemenRole) {
  const me = message.guild.members.me;
  const canRemoveReactions = message.channel.permissionsFor(me)?.has(PermissionsBitField.Flags.ManageMessages);

  const canManageRole = (role) =>
    role && !role.managed &&
    me.permissions.has(PermissionsBitField.Flags.ManageRoles) &&
    role.position < me.roles.highest.position;

  const filter = (reaction, user) => ['🎩','👠'].includes(reaction.emoji.name) && !user.bot;
  const collector = message.createReactionCollector({ filter, dispose: true });

  const busy = new Set();

  collector.on('collect', async (reaction, user) => {
    if (busy.has(user.id)) return;
    busy.add(user.id);
    try {
      const member = await message.guild.members.fetch(user.id);

      if (reaction.emoji.name === '🎩') {
        if (!canManageRole(gentlemenRole) || !canManageRole(ladiesRole)) return;
        await member.roles.add(gentlemenRole).catch(console.error);
        await member.roles.remove(ladiesRole).catch(() => {});
      } else {
        if (!canManageRole(ladiesRole) || !canManageRole(gentlemenRole)) return;
        await member.roles.add(ladiesRole).catch(console.error);
        await member.roles.remove(gentlemenRole).catch(() => {});
      }

      if (canRemoveReactions) {
        for (const r of message.reactions.cache.values()) {
          if (r.emoji.name !== reaction.emoji.name) {
            await r.users.remove(user.id).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('collect error:', e);
    } finally {
      busy.delete(user.id);
    }
  });

  collector.on('remove', async (reaction, user) => {
    try {
      const member = await message.guild.members.fetch(user.id);
      if (reaction.emoji.name === '🎩' && canManageRole(gentlemenRole)) {
        await member.roles.remove(gentlemenRole).catch(() => {});
      } else if (reaction.emoji.name === '👠' && canManageRole(ladiesRole)) {
        await member.roles.remove(ladiesRole).catch(() => {});
      }
    } catch (e) {
      console.error('remove error:', e);
    }
  });
}

async function restoreGenderCollector(client) {
  try {
    const rows = await MessageModel.find();
    for (const data of rows) {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) continue;
      try {
        const msg = await channel.messages.fetch(data.messageId);
        const guild = client.guilds.cache.get(data.guildId);
        if (!guild) continue;

        const ladiesRole = guild.roles.cache.get(data.ladiesRoleId);
        const gentlemenRole = guild.roles.cache.get(data.gentlemenRoleId);
        if (!ladiesRole || !gentlemenRole) continue;

        setupReactionCollector(msg, ladiesRole, gentlemenRole);
      } catch (e) {
        console.error('restore fetch fail:', e);
      }
    }
  } catch (e) {
    console.error('restoreGenderCollector error:', e);
  }
}
