const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const Welcome = require('../../Models/Welcome');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Welcome sistemini ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((cmd) =>
      cmd
        .setName('setup')
        .setDescription('Welcome mesajı ve rolünü ayarla')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Welcome mesajının gideceği kanal')
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt
            .setName('welcome-role')
            .setDescription('Yeni katılana verilecek rol')
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('welcome-message')
            .setDescription('İsteğe bağlı karşılama mesajı')
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd.setName('remove').setDescription('Welcome ayarını kaldır'),
    ),

  async execute(interaction) {
    const { guild, options } = interaction;
    const me = guild.members.me;
    const sub = options.getSubcommand();

    if (sub === 'setup') {
      const channel = options.getChannel('channel', true);
      const role = options.getRole('welcome-role', true);
      const msg = options.getString('welcome-message') || '';

      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({
          content: 'Botun **Manage Roles** izni yok.',
          ephemeral: true,
        });
      }

      if (
        ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
          channel.type,
        )
      ) {
        return interaction.reply({
          content: 'Lütfen bir **metin kanalı** seç.',
          ephemeral: true,
        });
      }
      const canSend = channel.permissionsFor(me)?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
      ]);
      if (!canSend) {
        return interaction.reply({
          content: 'Seçilen kanalda mesaj göndermeye yetkim yok.',
          ephemeral: true,
        });
      }

      if (role.managed || role.id === guild.id) {
        return interaction.reply({
          content: 'Bu rol atanamaz (managed/@everyone).',
          ephemeral: true,
        });
      }
      if (role.position >= me.roles.highest.position) {
        return interaction.reply({
          content:
            'Seçtiğin rol, botun en yüksek rolünün **üstünde**. Rol sırasını düzelt.',
          ephemeral: true,
        });
      }

      await Welcome.updateOne(
        { Guild: guild.id },
        { Guild: guild.id, Channel: channel.id, Role: role.id, Msg: msg },
        { upsert: true },
      );

      return interaction.reply({
        content: '☑️ Welcome ayarları kaydedildi/güncellendi.',
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const res = await Welcome.deleteMany({ Guild: guild.id });
      if (res.deletedCount === 0) {
        return interaction.reply({
          content: 'Henüz bir welcome ayarı yok.',
          ephemeral: true,
        });
      }
      return interaction.reply({
        content: '☑️ Welcome ayarı kaldırıldı.',
        ephemeral: true,
      });
    }
  },
};
