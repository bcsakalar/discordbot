const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, ChannelType, PermissionsBitField
} = require('discord.js');
const TicketSetup = require('../../Models/Ticketsetup');
const ServerSettings = require('../../Models/ServerSettings');

function parseButton(input, index) {
  if (!input) return null;
  const parts = input.split(',').map(s => s?.trim()).filter(Boolean);
  if (!parts.length) return null;

  const label = parts[0].slice(0, 80);
  const customId = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 100);

  const emoji = parts[1] || null;
  const styles = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger];
  return { label, customId, emoji, style: styles[index % styles.length] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription("Ticket panelini oluştur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Panel mesajının gideceği kanal').setRequired(true)
       .addChannelTypes(ChannelType.GuildText))
    .addChannelOption(o =>
      o.setName('kategori').setDescription('Açılacak ticket kanallarının kategorisi').setRequired(true)
       .addChannelTypes(ChannelType.GuildCategory))
    .addChannelOption(o =>
      o.setName('transkript').setDescription('Transkriptlerin gideceği kanal').setRequired(true)
       .addChannelTypes(ChannelType.GuildText))
    .addRoleOption(o =>
      o.setName('rol').setDescription('Ticketları yönetecek rol').setRequired(true))
    .addRoleOption(o =>
      o.setName('everyone').setDescription('@everyone').setRequired(true))
    .addStringOption(o =>
      o.setName('açıklama').setDescription('Panel açıklaması').setRequired(true))
    .addStringOption(o =>
      o.setName('ilkbutton').setDescription('Format: Ad, Emoji (örn: destek, 🎫)').setRequired(true))
    .addStringOption(o =>
      o.setName('ikincibutton').setDescription('Format: Ad, Emoji').setRequired(true))
    .addStringOption(o =>
      o.setName('üçüncübutton').setDescription('Format: Ad, Emoji').setRequired(true))
    .addStringOption(o =>
      o.setName('dördüncübutton').setDescription('Format: Ad, Emoji').setRequired(true)),

  async execute(interaction) {
    try {
      const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id }).lean();
      const allowedChannelId = serverSettings?.ticket_channel;
      if (allowedChannelId && allowedChannelId !== 'all_channels' && interaction.channelId !== allowedChannelId) {
        const ch = interaction.guild.channels.cache.get(allowedChannelId);
        return interaction.reply({
          content: `Bu komut yalnızca **#${ch?.name || 'ticket'}** kanalında kullanılabilir.`,
          ephemeral: true
        });
      }

      const { options, guild } = interaction;
      const panelChannel = options.getChannel('kanal', true);
      const category     = options.getChannel('kategori', true);
      const transcripts  = options.getChannel('transkript', true);
      const handlers     = options.getRole('rol', true);
      const everyone     = options.getRole('everyone', true);
      const description  = options.getString('açıklama', true);

      const me = guild.members.me;
      const canSend = panelChannel.permissionsFor(me)?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks
      ]);
      if (!canSend) {
        return interaction.reply({ content: 'Seçilen kanalda mesaj gönderme iznim yok.', ephemeral: true });
      }

      const inputs = [
        options.getString('ilkbutton', true),
        options.getString('ikincibutton', true),
        options.getString('üçüncübutton', true),
        options.getString('dördüncübutton', true),
      ];
      const buttonsParsed = inputs.map(parseButton).filter(Boolean);

      if (buttonsParsed.length < 2) {
        return interaction.reply({ content: 'En az iki geçerli buton girin (Ad, Emoji).', ephemeral: true });
      }

      await TicketSetup.findOneAndUpdate(
        { GuildID: guild.id },
        {
          Channel: panelChannel.id,
          Category: category.id,
          Transcripts: transcripts.id,
          Handlers: handlers.id,
          Everyone: everyone.id,
          Description: description,
          Buttons: buttonsParsed.map(b => b.customId),
        },
        { upsert: true, new: true }
      );

      const row = new ActionRowBuilder();
      for (const b of buttonsParsed) {
        const btn = new ButtonBuilder()
          .setCustomId(b.customId)
          .setLabel(b.label)
          .setStyle(b.style);
        if (b.emoji) btn.setEmoji(b.emoji);
        row.addComponents(btn);
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Destek Paneli')
        .setDescription(description)
        .setColor(0x2f3136);

      await panelChannel.send({ embeds: [embed], components: [row] });

      return interaction.reply({ content: '☑️ Ticket paneli gönderildi.', ephemeral: true });
    } catch (err) {
      console.error('ticketsetup error:', err);
      const errEmbed = new EmbedBuilder().setColor('Red').setDescription('Bir hata oluştu...');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    }
  },
};
