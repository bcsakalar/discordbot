const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const HogwartsMessageModel = require('../../Models/HogwartsRoles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hogwartsrolver')
    .setDescription('Hogwarts hanelerine göre rol atamak için emojiye tıklayın.')
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Mesajın gönderileceği kanal.').setRequired(true))
    .addRoleOption(o =>
      o.setName('gryffindor').setDescription('Gryffindor rolü').setRequired(true))
    .addRoleOption(o =>
      o.setName('hufflepuff').setDescription('Hufflepuff rolü').setRequired(true))
    .addRoleOption(o =>
      o.setName('ravenclaw').setDescription('Ravenclaw rolü').setRequired(true))
    .addRoleOption(o =>
      o.setName('slytherin').setDescription('Slytherin rolü').setRequired(true)),

  async execute(interaction) {
    const allowedUserIds = ['323975996829073418'];
    if (!allowedUserIds.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Bu komut özel.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel        = interaction.options.getChannel('kanal');
      const gryffindorRole = interaction.options.getRole('gryffindor');
      const hufflepuffRole = interaction.options.getRole('hufflepuff');
      const ravenclawRole  = interaction.options.getRole('ravenclaw');
      const slytherinRole  = interaction.options.getRole('slytherin');

      const me = interaction.guild.members.me;

      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply('Rolleri yönetmek için iznim yok.');
      }
      const roles = [gryffindorRole, hufflepuffRole, ravenclawRole, slytherinRole];
      const bad = roles.find(r => !r || r.managed || r.position >= me.roles.highest.position);
      if (bad) {
        return interaction.editReply(
          'Seçtiğin rollerden en az biri atanamaz. ' +
          '• **managed** olmamalı\n' +
          '• Botun en yüksek rolü bu rollerin **üstünde** olmalı.'
        );
      }

      const message = await channel.send({
        content: 'Gryffindor için 🦁, Hufflepuff için 🦡, Ravenclaw için 🦅, Slytherin için 🐍 emojisine tıklayın.',
      });

      await message.react('🦁');
      await message.react('🦡');
      await message.react('🦅');
      await message.react('🐍');

      await HogwartsMessageModel.create({
        messageId: message.id,
        channelId: channel.id,
        guildId: interaction.guild.id,
        gryffindorRoleId: gryffindorRole.id,
        hufflepuffRoleId: hufflepuffRole.id,
        ravenclawRoleId: ravenclawRole.id,
        slytherinRoleId: slytherinRole.id
      });

      setupReactionCollector(message, gryffindorRole, hufflepuffRole, ravenclawRole, slytherinRole);

      await interaction.editReply('Mesaj gönderildi ve tepkiler ayarlandı. Süresiz aktif.');
    } catch (err) {
      console.error('Komut hatası:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  },

  restoreHogwartsCollector
};

function setupReactionCollector(message, gryffindorRole, hufflepuffRole, ravenclawRole, slytherinRole) {
  const filter = (reaction, user) => ['🦁','🦡','🦅','🐍'].includes(reaction.emoji.name) && !user.bot;
  const collector = message.createReactionCollector({ filter, dispose: true });

  const clearAll = (member) =>
    member.roles.remove([gryffindorRole, hufflepuffRole, ravenclawRole, slytherinRole]).catch(() => {});

  collector.on('collect', async (reaction, user) => {
    try {
      const member = await message.guild.members.fetch(user.id);
      await clearAll(member);
      if (reaction.emoji.name === '🦁') await member.roles.add(gryffindorRole);
      if (reaction.emoji.name === '🦡') await member.roles.add(hufflepuffRole);
      if (reaction.emoji.name === '🦅') await member.roles.add(ravenclawRole);
      if (reaction.emoji.name === '🐍') await member.roles.add(slytherinRole);

      for (const r of message.reactions.cache.values()) {
        if (r.emoji.name !== reaction.emoji.name) await r.users.remove(user.id).catch(() => {});
      }
    } catch (e) {
      console.error('Rol değiştirme hatası:', e);
    }
  });

  collector.on('remove', async (reaction, user) => {
    try {
      const member = await message.guild.members.fetch(user.id);
      if (reaction.emoji.name === '🦁') await member.roles.remove(gryffindorRole).catch(() => {});
      if (reaction.emoji.name === '🦡') await member.roles.remove(hufflepuffRole).catch(() => {});
      if (reaction.emoji.name === '🦅') await member.roles.remove(ravenclawRole).catch(() => {});
      if (reaction.emoji.name === '🐍') await member.roles.remove(slytherinRole).catch(() => {});
    } catch (e) {
      console.error('Rol kaldırma hatası:', e);
    }
  });
}

async function restoreHogwartsCollector(client) {
  try {
    const messages = await HogwartsMessageModel.find();
    for (const data of messages) {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) continue;

      channel.messages.fetch(data.messageId).then(async message => {
        const guild = client.guilds.cache.get(data.guildId);
        if (!guild) return;

        const gryffindorRole = guild.roles.cache.get(data.gryffindorRoleId);
        const hufflepuffRole  = guild.roles.cache.get(data.hufflepuffRoleId);
        const ravenclawRole   = guild.roles.cache.get(data.ravenclawRoleId);
        const slytherinRole   = guild.roles.cache.get(data.slytherinRoleId);
        if (!gryffindorRole || !hufflepuffRole || !ravenclawRole || !slytherinRole) return;

        setupReactionCollector(message, gryffindorRole, hufflepuffRole, ravenclawRole, slytherinRole);
      }).catch(err => console.error('Mesaj bulunamadı:', err));
    }
  } catch (e) {
    console.error('Kolektörleri geri yüklerken hata:', e);
  }
}
