const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
  } = require("discord.js");
  const ms = require("ms");
  const ServerSettings = require('../../Models/ServerSettings');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("untimeout")
      .setDescription("Bir Üyenin Zaman Aşımını Kaldır.")
      .addUserOption((option) =>
        option
          .setName("hedef")
          .setDescription("Zaman Aşımı Kaldırılacak Üye")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("neden")
          .setDescription("Neden")
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
      if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({
          content: "Zaman Aşımı Komutunu Adminler Üzerinde Uygulayamazsın",
        });
  
      await timeMember.timeout(null, reason);

      if(!timeMember.timeout) return await interaction.reply({content: `**${user.tag}** üyesi zaten bir zaman aşımı almamış`});
  
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Zaman Aşımı Kaldırıldı")
        .addFields({ name: "Üye", value: `> ${user.tag}`, inline: true})
        .addFields({ name: "Neden", value: `> ${reason}`, inline: true})
        .setTimestamp()
  
        const dmEmbed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(`☑️ ${guild.name} sunucusunda zaman aşımın kaldırıldı. Durumu görüntülemek için sunucuya Bakabilirsin | Sebebi: ${reason}`)
  
        await timeMember.send({embeds: [dmEmbed]}).catch(err => {return});
  
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('unmute komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'unmute komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

  
  
    },
  };
  