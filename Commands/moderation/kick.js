const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Bir Üyeyi Uzaklaştır")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("hedef")
        .setDescription("Uzaklaştırılacak Birini Seç")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("neden")
        .setDescription("Uzaklaştırma Nedeni")
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
    const reason = options.getString("neden") || "Neden Belirtilmedi";

    const member = guild.members.cache.get(user.id);

    if (!member)
      return await interaction.reply({
        content: "Bu Kullanıcı Artık Bu Sunucuda Değil!",
        ephemeral: true,
      });
      if (interaction.member.id === member.id)
        return await interaction.reply({ content: "Kendini Uzaklaştıramazsın." });

      const dmEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`⚠️ ${guild.name} sunucusundan Uzaklaştırıldın. | Nedeni: ${reason}`)

      await member.send({embeds: [dmEmbed]});

    try {
      await member.kick({ reason });

      const embed = new EmbedBuilder()
        .setColor("Green")
        .addFields(
          { name: "Uzaklaştırılan Kişi", value: `> ${user}`, inline: true },
          { name: "Nedeni", value: `> ${reason}`, inline: true}
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      const errEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`${user} Kullanıcısını Uzaklaştıramazsın!!!`)
        

        await interaction.reply({ embeds: [errEmbed] });

    }
  } catch (error) {
    console.error('kick komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'kick komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}
  },
};
