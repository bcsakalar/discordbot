// guild/guildcreate.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      const me = guild.members.me;

      const canSend = ch =>
        ch?.type === ChannelType.GuildText &&
        ch.permissionsFor(me)?.has([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]);

      const defaultChannel =
        (guild.systemChannel && canSend(guild.systemChannel))
          ? guild.systemChannel
          : guild.channels.cache.find(canSend);

      if (!defaultChannel) return;

      // Tüm text kanallarını hazırla
      const textChannelsAll = guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildText)
        .map(ch => ({ label: ch.name, value: ch.id }));

      // Menü başına 25 limit → “Tüm Kanallar” + 24 kanal
      const chunk = (arr, size) => arr.reduce((a,_,i)=>
        (i % size ? a : [...a, arr.slice(i, i+size)]), []);
      const MAX_OPTIONS = 25;

      const headerOption = {
        label: 'Tüm Kanallar',
        value: 'all_channels',
        description: 'Bu seçeneği seçerek tüm kanalları aynı anda ayarlayabilirsiniz.'
      };
      // ilk menüye header’ı ekleyebilmek için +1 boşluk bırak
      const firstChunkRoom = MAX_OPTIONS - 1;
      const [first, ...rest] = chunk(textChannelsAll, firstChunkRoom);
      const menus = [[headerOption, ...first], ...rest];

      const intro = new EmbedBuilder()
        .setColor('#e01444')
        .setTitle('Merhaba!')
        .setDescription(
          "Beni sunucuna eklediğin için teşekkürler!\n\n'/' ön ekini kullanarak komutları çağırabilirsin.\n\n" +
          "**Aşağıdan botu kullanmak için gerekli kurulumları yapınız!**\n\n" +
          "Eğer eklediğiniz veya var olan kanallarınız gözükmüyorsa **/ayar_kanal_guncelle** komutunu kullanın.\n\n" +
          "**Bu mesajı okuduğunuz kanalın izinlerini düzenleyin; yetkisiz kişiler ayarları değiştiremesin.**\n" +
          "(Seçenekler için YÖNETİCİ rolü gerekir)\n\n" +
          "**Herhangi bir kanala `/help` yazarak başlayabilirsiniz.**"
        );

      const sentMessage = await defaultChannel.send({ embeds: [intro] });

      // Pin izni varsa sabitle
      const canPin = defaultChannel.permissionsFor(me)
        ?.has(PermissionsBitField.Flags.ManageMessages);
      if (canPin) {
        await sentMessage.pin().catch(() => {});
      }

      // Yardımcı: tek bir “ayar” mesajı oluşturup tekrar eden kodu azalt
      const sendSelect = async (title, placeholder, customIdBase) => {
        // Çok kanal varsa birden fazla menu bloğu gönder
        for (let i = 0; i < menus.length; i++) {
          const embed = new EmbedBuilder()
            .setTitle(title + (menus.length > 1 ? ` (${i+1}/${menus.length})` : ''))
            .setDescription(`Lütfen aşağıdaki seçim menüsünü kullanarak ${placeholder.toLowerCase()} seçin.`)
            .setColor('#00FF00');

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`${customIdBase}${menus.length > 1 ? `_${i+1}` : ''}`)
              .setPlaceholder(placeholder)
              .addOptions(menus[i])
          );

          await defaultChannel.send({ embeds: [embed], components: [row] });
        }
      };

      await sendSelect('Oyun Kanalı Ayarı', 'Oyun kanalı seçin', 'select_game_channel');
      await sendSelect('Eğlence Kanalı Ayarı', 'Eğlence kanalı seçin', 'select_fun_channel');
      await sendSelect('Çekiliş Kanalı Ayarı', 'Çekiliş kanalı seçin', 'select_cekilis_channel');
      await sendSelect('Bilgi Kanalı Ayarı', 'Bilgi kanalı seçin', 'select_info_channel');
      await sendSelect('Level Kanalı Ayarı', 'Level kanalı seçin', 'select_levels_channel');
      await sendSelect('Moderasyon Kanalı Ayarı', 'Moderasyon kanalı seçin', 'select_moderation_channel');
      await sendSelect('Araçlar Kanalı Ayarı', 'Araçlar kanalı seçin', 'select_tools_channel');
      await sendSelect('Anket Kanalı Ayarı', 'Anket kanalı seçin', 'select_poll_channel');
      await sendSelect('Tepki Kanalı Ayarı', 'Tepki kanalı seçin', 'select_reactor_channel');
      await sendSelect('Ticket Kanalı Ayarı', 'Ticket kanalı seçin', 'select_ticket_channel');

      // Welcome/Goodbye bilgilendirme (ephemeral YOK!)
      await defaultChannel.send({
        embeds: [new EmbedBuilder()
          .setTitle('Welcome Kanalı Ayarı **(YÖNETİCİ ROLÜ GEREKİR)**')
          .setDescription("Welcome ayarlamak için **/welcome** komutunu kullanın. (Yeni gelenlere hoş geldin mesajı gönderir)")
          .setColor('#00FF00')]
      });

      await defaultChannel.send({
        embeds: [new EmbedBuilder()
          .setTitle('Goodbye Kanalı Ayarı **(YÖNETİCİ ROLÜ GEREKİR)**')
          .setDescription("Goodbye ayarlamak için **/goodbye** komutunu kullanın. (Sunucudan ayrılanları bildirir)")
          .setColor('#00FF00')]
      });

      await defaultChannel.send({
        embeds: [new EmbedBuilder()
          .setTitle('Level İçin Rol Atama **(MODERATÖR ROLÜ GEREKİR)**')
          .setDescription("Belirli seviyelere rol atamak için **/setlevelrole**, kaldırmak için **/removelevelrole**, listelemek için **/listlevelrole**.")
          .setColor('#00FF00')]
      });

    } catch (error) {
      console.error('Bir hata oluştu', error);
      // Burada defaultChannel.send kullanırken yine izin kontrolü yap
      try {
        const me = guild.members.me;
        const dc = guild.systemChannel || guild.channels.cache.find(ch =>
          ch?.type === ChannelType.GuildText &&
          ch.permissionsFor(me)?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages])
        );
        if (dc) {
          await dc.send('Bir hata oluştu veya bu seçenekleri kullanmak için belirli izinlere sahip değilsiniz!');
        }
      } catch {}
    }
  }
};
