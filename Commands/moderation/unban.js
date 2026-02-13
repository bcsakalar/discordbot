const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir Üyeyin Banını Kaldır!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Banı Kaldırılacak Üyenin ID Bilgilerini Gir")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("neden")
        .setDescription("Ban Kaldırma Nedeni")
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
    const user = interaction.options.getUser("user");
    const reason = options.getString("neden") || "Neden Belirtilmedi";

    try {
      await guild.members.unban(user, reason);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .addFields(
          { name: "Banı Kaldırılan Kişi", value: `> ${user}`, inline: true },
          { name: "Nedeni", value: `> ${reason}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Unban işlemi sırasında hata oluştu:", error);

      const errEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Hata Oluştu")
        .setDescription("Belirtilen kullanıcının banı kaldırılamadı. Kullanıcı sunucuda banlı olmayabilir veya başka bir hata oluşmuş olabilir.");

      await interaction.reply({ embeds: [errEmbed] });
    }
  } catch (error) {
    console.error('unban komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'unban komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}

  },
};
