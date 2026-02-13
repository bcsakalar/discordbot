const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

// Sadece bu Discord ID'leri !ac / !kapat kullanabilir:
const PROTECTED_IDS = [
  '323975996829073418'
];

const ARDUINO_IP = process.env.ARDUINO_IP;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arduino')
    .setDescription('Arduino LCD ve kapı kontrol komutları')
    .addSubcommand(sub =>
      sub
        .setName('yaz')
        .setDescription('LCD’ye istediğin metni yazar')
        .addStringOption(opt =>
          opt
            .setName('mesaj')
            .setDescription('Ekrana basılacak metin')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ac')
        .setDescription('Kapıyı açar (izinli kullanıcılar)')
    )
    .addSubcommand(sub =>
      sub
        .setName('kapat')
        .setDescription('Kapıyı kapatır (izinli kullanıcılar)')
    ),

  async execute(interaction) {
    const arduinoIP = ARDUINO_IP || interaction.client?.config?.arduinoIP;
    if (!arduinoIP) {
      return interaction.reply({
        content: 'Arduino IP adresi ayarlanmamış. Lütfen yöneticiye haber verin.',
        ephemeral: true,
      });
    }
    const sub       = interaction.options.getSubcommand();
    const userId    = interaction.user.id;

    // Slash komutlarında hemen ack alalım
    await interaction.deferReply({ ephemeral: true });

    try {
      // --- 1) HERKESE AÇIK: /arduino yaz <mesaj> ---
      if (sub === 'yaz') {
        const text = interaction.options.getString('mesaj');
        const url  = `http://${arduinoIP}/message`;
        await axios.get(url, { params: { msg: text } });
        return interaction.editReply(`✅ LCD'ye yazıldı: **${text}**`);
      }

      // --- 2) SADECE PROTECTED_IDS: ac / kapat ---
      if (!PROTECTED_IDS.includes(userId)) {
        return interaction.editReply('❌ Bu komutu kullanmaya yetkiniz yok.');
      }

      // ac veya kapat endpoint’ine isteği yolla
      const url = `http://${arduinoIP}/${sub}`;
      await axios.get(url);
      return interaction.editReply(
        sub === 'ac'
          ? '🔓 Kapı açıldı.'
          : '🔒 Kapı kapatıldı.'
      );
    } catch (err) {
      console.error(`/arduino ${sub} hatası:`, err);
      return interaction.editReply('⚠️ Arduino ile iletişimde hata oluştu.');
    }
  },
};
