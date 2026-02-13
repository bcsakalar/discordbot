const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const ms = require("ms");
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Kullanıcya Zaman Aşıma Uygular")
    .addUserOption((option) =>
      option
        .setName("hedef")
        .setDescription("Zaman Aşımı Uygulanacak Üye")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("sure")
        .setDescription("Zaman Aşımı Uygulanacak Süre")
        .setRequired(true)
        .addChoices(
          { name: "60 Seconds", value: "60" },
          { name: "2 Minutes", value: "120" },
          { name: "5 Minutes", value: "300" },
          { name: "10 Minutes", value: "600" },
          { name: "15 Minutes", value: "900" },
          { name: "20 Minutes", value: "1200" },
          { name: "30 Minutes", value: "1800" },
          { name: "45 Minutes", value: "2700" },
          { name: "1 Hour", value: "3600" },
          { name: "2 Hour", value: "7200" },
          { name: "3 Hour", value: "10800" },
          { name: "5 Hour", value: "18000" },
          { name: "1 Day", value: "86400" },
          { name: "2 Day", value: "172800" },
          { name: "3 Day", value: "259200" },
          { name: "5 Day", value: "432000" },
          { name: "1 Week", value: "604800" },
          { name: "2 Week", value: "1209600" },
          { name: "1 Month", value: "2592000" },
          { name: "2 Month", value: "5184000" },
          { name: "3 Month", value: "10368000" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("neden")
        .setDescription("Zaman Aşımı Yapacak Sebep Giriniz")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Fetch server settings to get the allowed game channel ID
      const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
      const allowedChannelId = serverSettings?.moderation_channel;

      if (!allowedChannelId) {
          return interaction.reply({ content: "Modearasyon kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
      }

      if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
        const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
        return interaction.reply({ 
            content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Moderasyon"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
            ephemeral: true 
        });
    }

    const { options, guild } = interaction;
    const user = options.getUser("hedef");
    const duration = options.getString("sure");
    const reason = options.getString("neden") || "Neden Belirtilmedi";
    const timeMember = guild.members.cache.get(user.id);

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    )
      return await interaction.reply({
        content: "Bu Komutu Kullanmaya Yetkin Yok!",
        ephemeral: true,
      });
    if (!timeMember)
      return await interaction.reply({
        content: "Bu Kullanıcı Artık Bu Sunucuda Değil!",
        ephemeral: true,
      });
    if (interaction.member.id === timeMember.id)
      return await interaction.reply({ content: "Kendini Susturamazsın." });
    if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator))
      return await interaction.reply({
        content: "Zaman Aşımı Komutunu Adminler Üzerinde Uygulayamazsın",
      });

    await timeMember.timeout(duration * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Zaman Aşımı")
      .addFields({ name: "Üye", value: `> ${user.tag}`, inline: true})
      .addFields({
        name: "Süre",
        value: `> ${duration / 60} dakika`, inline: true
      })
      .addFields({ name: "Neden", value: `> ${reason}`, inline: true})
      .setTimestamp()

      const dmEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`⚠️ ${guild.name} sunucusunda sana ${duration} saniye zaman aşımı uygulandı. Durumu görüntülemek için sunucuya Bakabilirsin | Sebebi: ${reason}`)

      await timeMember.send({embeds: [dmEmbed]}).catch(err => {return});

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('mute komutu sırasında bir hata oluştu:', error);
      await interaction.reply({
          content: 'mute komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
          ephemeral: true
      });
  }


  },
};
