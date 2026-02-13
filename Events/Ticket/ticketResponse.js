const {
  ChannelType, ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle, PermissionFlagsBits
} = require('discord.js');
const ticketSchema = require('../../Models/Ticket');
const TicketSetup  = require('../../Models/Ticketsetup');

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { guild, member, customId } = interaction;
    const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory, EmbedLinks, AttachFiles } = PermissionFlagsBits;

    const setup = await TicketSetup.findOne({ GuildID: guild.id });
    if (!setup) return;
    if (!setup.Buttons?.includes(customId)) return;

    if (!guild.members.me.permissions.has(ManageChannels)) {
      return interaction.reply({ content: 'Buna yetkim yok (ManageChannels).', ephemeral: true });
    }

    const ticketId = Math.floor(Math.random() * 9000) + 10000;

    try {
      const ch = await guild.channels.create({
        name: `${member.user.username}-ticket-${ticketId}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: setup.Everyone, deny: [ViewChannel, SendMessages, ReadMessageHistory] },
          { id: member.id,     allow: [ViewChannel, SendMessages, ReadMessageHistory] },
          ...(setup.Handlers ? [{ id: setup.Handlers, allow: [ViewChannel, SendMessages, ReadMessageHistory] }] : [])
        ]
      });

      await ticketSchema.create({
        GuildID: guild.id,
        ChannelID: ch.id,
        TicketID: ticketId,
        MembersID: [member.id],     
        Closed: false,
        Locked: false,
        Type: customId,
        Claimed: false
      });

      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} — Ticket ${customId}`)
        .setDescription("Ticket sıraya alındı. En kısa sürede yanıt verilecektir.")
        .setFooter({ text: `${ticketId}`, iconURL: member.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('kapat').setLabel("Ticket'ı kapat").setStyle(ButtonStyle.Primary).setEmoji('🔴'),
        new ButtonBuilder().setCustomId('kilitle').setLabel("Ticket'ı kilitle").setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('aç').setLabel("Ticket'ı aç").setStyle(ButtonStyle.Success).setEmoji('🔓'),
        new ButtonBuilder().setCustomId('talep').setLabel("Talep et").setStyle(ButtonStyle.Secondary).setEmoji('🧾')
      );

      await ch.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: 'Ticket başarıyla oluşturuldu.', ephemeral: true });

    } catch (err) {
      console.error('ticket create error:', err);
      return interaction.reply({ content: 'Ticket oluşturulurken hata oluştu.', ephemeral: true });
    }
  }
};
