const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const ticketSetup  = require('../../Models/Ticketsetup');
const ticketSchema = require('../../Models/Ticket');

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { guild, member, customId, channel } = interaction;
    if (!["kapat", "kilitle", "aç", "talep"].includes(customId)) return;

    const { ManageChannels, SendMessages, ReadMessageHistory, EmbedLinks, AttachFiles, ManageMessages, ViewChannel } = PermissionFlagsBits;

    const setup = await ticketSetup.findOne({ GuildID: guild.id });
    if (!setup) return;

    const data = await ticketSchema.findOne({ ChannelID: channel.id });
    if (!data) return;

    const isOwner   = Array.isArray(data.MembersID) && data.MembersID.includes(member.id);
    const isHandler = setup.Handlers ? member.roles.cache.has(setup.Handlers) : false;

    const me = guild.members.me;
    const canSendHere = channel.permissionsFor(me)?.has([ViewChannel, SendMessages, EmbedLinks]);
    if (!canSendHere) {
      return interaction.reply({ content: 'Bu kanalda mesaj/Embed yetkim yok.', ephemeral: true });
    }

    const reply = (content) => interaction.reply({ content, ephemeral: true });
    const embed = new EmbedBuilder().setColor('Aqua');

    switch (customId) {

      case 'kapat': {
        if (!(isOwner || isHandler)) return reply('Bu işlemi sadece ticket sahibi veya yetkili yapabilir.');

        if (data.Closed) return reply('Ticket zaten kapatıldı/silinecek.');

        const canTranscript = channel.permissionsFor(me)?.has([ReadMessageHistory, ViewChannel]);
        const canSendToTranscripts = setup.Transcripts
          ? guild.channels.cache.get(setup.Transcripts)?.permissionsFor(me)?.has([ViewChannel, SendMessages, EmbedLinks, AttachFiles])
          : false;

        let resMsgUrl = null;

        try {
          const transcript = await createTranscript(channel, {
            limit: -1,
            returnBuffer: false,
            fileName: `${member.user.username}-ticket-${data.Type}-${data.TicketID}.html`
          });

          await ticketSchema.updateOne({ ChannelID: channel.id }, { Closed: true });

          if (setup.Transcripts && canSendToTranscripts) {
            const transcriptEmbed = new EmbedBuilder()
              .setTitle(`Transcript — Type: ${data.Type} | ID: ${data.TicketID}`)
              .setTimestamp()
              .setFooter({ text: member.user.tag, iconURL: member.displayAvatarURL({ dynamic: true }) });

            const sent = await guild.channels.cache.get(setup.Transcripts).send({
              embeds: [transcriptEmbed],
              files: [transcript]
            });
            resMsgUrl = sent.url;
          }

          const info = new EmbedBuilder()
            .setTitle('Transcript hazırlanıyor…')
            .setDescription('Ticket 10 saniye içinde kapatılacak. DM’lerinizi açık tutun.')
            .setColor('Red')
            .setTimestamp()
            .setFooter({ text: member.user.tag, iconURL: member.displayAvatarURL({ dynamic: true }) });

          await channel.send({ embeds: [info] });

          setTimeout(async () => {
            if (resMsgUrl) {
              await member.send({ embeds: [new EmbedBuilder()
                .setTitle('Ticket Transcript')
                .setDescription(`Transcript bağlantınız: ${resMsgUrl}`)
                .setTimestamp()] }).catch(() => channel.send('DM ile transcript gönderilemedi.'));
            }
            if (channel.permissionsFor(me)?.has(ManageChannels)) {
              await channel.delete().catch(() => {});
            }
          }, 10_000);

          return;
        } catch (e) {
          console.error('kapat error:', e);
          return reply('Transcript oluşturulurken hata oluştu.');
        }
      }

      case 'kilitle': {
        if (!isHandler) return reply('Bu işlemi sadece yetkililer yapabilir.');
        if (data.Locked)  return reply('Ticket zaten kilitli.');

        await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: true });
        embed.setDescription('Ticket kilitlendi 🔒');

        const targets = Array.isArray(data.MembersID) ? data.MembersID : [data.MembersID].filter(Boolean);
        for (const uid of targets) {
          await channel.permissionOverwrites.edit(uid, { SendMessages: false }).catch(()=>{});
        }
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'aç': {
        if (!isHandler) return reply('Bu işlemi sadece yetkililer yapabilir.');
        if (!data.Locked) return reply('Ticket kilitli değil.');

        await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: false });
        embed.setDescription('Ticket kilidi kaldırıldı 🔓');

        const targets = Array.isArray(data.MembersID) ? data.MembersID : [data.MembersID].filter(Boolean);
        for (const uid of targets) {
          await channel.permissionOverwrites.edit(uid, { SendMessages: true }).catch(()=>{});
        }
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'talep': {
        if (!isHandler) return reply('Bu işlemi sadece yetkililer yapabilir.');
        if (data.Claimed)  return reply(`Ticket zaten <@${data.ClaimedBy}> tarafından talep edildi.`);

        await ticketSchema.updateOne({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });
        embed.setDescription(`Ticket ${member} tarafından talep edildi.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
};
