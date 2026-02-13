const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayar_kanal_guncelle')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Mevcut ayar kanallarını günceller'),
  async execute(interaction) {
    const guild = interaction.guild;

    // Tüm metin kanallarını al
    const textChannels = guild.channels.cache
      .filter(channel => channel.type === 0) 
      .map(channel => ({
        label: channel.name,
        value: channel.id,
      }));

    // "Tüm Kanallar" seçeneğini ekle
    textChannels.unshift({
      label: 'Tüm Kanallar',
      value: 'all_channels',
      description: 'Bu seçeneği seçerek tüm kanalları aynı anda ayarlayabilirsiniz.',
    });

    // Hemen bir yanıt gönderiyoruz
    await interaction.reply({ content: 'Kanal seçim menüleri güncelleniyor... (Biraz belki 1 dakika zaman alabilir...)', ephemeral: true });

    // Ayarların yapıldığı embed ve menü seçenekleri
    const settings = [
      {
        title: 'Oyun Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak oyun kanalı seçin.',
        customId: 'select_game_channel',
        row: true
      },
      {
        title: 'Eğlence Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak eğlence kanalı seçin.',
        customId: 'select_fun_channel',
        row: true
      },
      {
        title: 'Çekiliş Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak çekiliş kanalı seçin.',
        customId: 'select_cekilis_channel',
        row: true
      },
      {
        title: 'Bilgi Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak bilgi kanalı seçin.',
        customId: 'select_info_channel',
        row: true
      },
      {
        title: 'Level Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak level kanalı seçin.',
        customId: 'select_levels_channel',
        row: true
      },
      {
        title: 'Moderasyon Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak moderasyon kanalı seçin.',
        customId: 'select_moderation_channel',
        row: true
      },
      {
        title: 'Araçlar Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak araçlar kanalı seçin.',
        customId: 'select_tools_channel',
        row: true
      },
      {
        title: 'Anket Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak anket kanalı seçin.',
        customId: 'select_poll_channel',
        row: true
      },
      {
        title: 'Tepki Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak tepki kanalı seçin.',
        customId: 'select_reactor_channel',
        row: true
      },
      {
        title: 'Ticket Kanalı Ayarı',
        description: 'Lütfen aşağıdaki seçim menüsünü kullanarak ticket kanalı seçin.',
        customId: 'select_ticket_channel',
        row: true
      },
      {
        title: 'Welcome Kanalı Ayarı **(YÖNETİCİ ROLÜ GEREKİR)**',
        description: 'Eğer welcome kanalı ayarlamak istiyorsanız /welcome yazarak welcome kanalını ayarla \n\n**(Welcome kanalı sunucunuza giren yeni kişilere hoş geldiniz mesajı gönderir)**',
        row: false
      },
      {
        title: 'Goodbye Kanalı Ayarı **(YÖNETİCİ ROLÜ GEREKİR)**',
        description: 'Eğer Goodbye kanalı ayarlamak istiyorsanız /goodbye yazarak goodbye kanalını ayarla \n\n**(Goodbye kanalı sunucunuzdan çıkan kişileri gösterir)**',
        row: false
      },
      {
        title: 'Level İçin Rol atama **(YÖNETİCİ ROLÜ GEREKİR)**',
        description: 'Eğer sunucunda senin belirlediğin levele ulaşan birine rol vermek istiyosan belirlediğin seviyeye rol atayabilirsin, komutu kullanmak için **/setlevelrole** komutunu kullanarak istediğin seviyeye istediğin rolü atayabilirsin, istersen **/removelevelrole** komutunu kullanarak ayarladığın rolleri kaldırabilirsin ve ** ayarladığın level kanalında /listlevelrole** komutu ile ayarladığın rolleri görebilirsin. \n\n **(ZORUNLU DEĞİL)**',
        row: false
      }
    ];

    // Mesajları güncelle veya gönder
    const messages = await interaction.channel.messages.fetch({ limit: 20 });

    for (const setting of settings) {
      const existingMessage = messages.find(msg => msg.embeds[0]?.title === setting.title);

      const embed = new EmbedBuilder()
        .setTitle(setting.title)
        .setDescription(setting.description)
        .setColor('#00FF00');

      let row = null;
      if (setting.row) {
        row = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(setting.customId)
              .setPlaceholder(`${setting.title.split(' ')[0]} kanalı seçin`)
              .addOptions(textChannels) // textChannels listesi içinde artık "Tüm Kanallar" seçeneği de mevcut
          );
      }

      if (existingMessage) {
        if (row) {
          await existingMessage.edit({ embeds: [embed], components: [row] });
        } else {
          await existingMessage.edit({ embeds: [embed] });
        }
      } else {
        if (row) {
          await interaction.channel.send({ embeds: [embed], components: [row] });
        } else {
          await interaction.channel.send({ embeds: [embed] });
        }
      }
    }

    await interaction.followUp({ content: 'Kanal seçim menüleri başarıyla güncellendi.', ephemeral: true });
  },
};