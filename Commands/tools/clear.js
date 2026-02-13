const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen miktarda mesajı siler')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('mesaj_sayisi')
        .setDescription('Silinecek mesaj sayısını giriniz')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  async execute(interaction, client) {
    try {
      const { options } = interaction;
      const channel = interaction.channel;
      const messageCount = options.getInteger('mesaj_sayisi');

      // İşlemin başladığını belirtmek için yanıtı erteliyoruz
      await interaction.deferReply({ ephemeral: true });

      // Sabitlenmiş mesajları al (bu mesajlar silinmeyecek)
      const pinnedMessages = await channel.messages.fetchPinned();
      const protectedMessages = pinnedMessages.map(msg => msg.id);

      // Belirtilen miktarda mesajı çekiyoruz
      const fetched = await channel.messages.fetch({ limit: messageCount });

      if (fetched.size === 0) {
        return await interaction.editReply({ content: 'Silinecek mesaj bulunamadı!', ephemeral: true });
      }

      // Sabitlenmiş mesajları hariç tutuyoruz
      const messagesToDelete = fetched.filter(msg => !protectedMessages.includes(msg.id));

      if (messagesToDelete.size === 0) {
        return await interaction.editReply({ content: 'Silinecek mesaj bulunamadı!', ephemeral: true });
      }

      // 14 gün süresini hesaplamak için (ms cinsinden)
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;

      // Bulk delete ile silinebilen mesajları filtreleyelim (14 günden daha yeni)
      const messagesToBulkDelete = messagesToDelete.filter(msg => (Date.now() - msg.createdTimestamp) < fourteenDays);
      
      // Bulk delete ile silinemeyen, yani 14 günden eski mesajlar
      const messagesToDeleteIndividually = messagesToDelete.filter(msg => (Date.now() - msg.createdTimestamp) >= fourteenDays);

      let bulkDeletedCount = 0;
      if (messagesToBulkDelete.size > 0) {
        // Bulk delete yöntemi, 14 günden eski mesajları silemez
        const bulkDeleted = await channel.bulkDelete(messagesToBulkDelete, true);
        bulkDeletedCount = bulkDeleted.size;
      }

      let individuallyDeletedCount = 0;
      for (const msg of messagesToDeleteIndividually.values()) {
        try {
          await msg.delete();
          individuallyDeletedCount++;
        } catch (e) {
          console.error(`Mesaj ${msg.id} silinirken hata oluştu:`, e);
        }
      }

      const totalDeleted = bulkDeletedCount + individuallyDeletedCount;

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription(`☑️ **${totalDeleted}** mesaj silindi.`);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Mesaj silme işlemi sırasında bir hata oluştu:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Mesaj silme işlemi sırasında bir hata oluştu.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'Mesaj silme işlemi sırasında bir hata oluştu.', ephemeral: true });
      }
    }
  }
};
