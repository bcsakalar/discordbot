const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Hangman } = require('discord-gamecord');
const ServerSettings = require('../../Models/ServerSettings');

const wordsByCategory = {
  doğa: [
    'ağaç', 'göl', 'orman', 'nehir', 'dağ', 'çiçek', 'yaprak', 'toprak', 'taş', 'bulut',
    'güneş', 'ay', 'yıldız', 'kumsal', 'deniz', 'okyanus', 'vadi', 'tepe', 'çay', 'dere',
    'rüzgar', 'fırtına', 'yağmur', 'kar', 'dolu', 'sis', 'çimen', 'ot', 'kök', 'dal',
    'gölge', 'volkan', 'bataklık', 'kayalık', 'kanyon', 'bozkır', 'çöl', 'bataklık', 'kıyı',
    'vadiler', 'kayalık', 'akarsu', 'yayla', 'şelale', 'kasırga', 'hortum', 'çim', 'bahar',
    'yaz', 'sonbahar', 'kış', 'çığ', 'taşkın', 'depremler', 'zemin', 'pınar', 'kaynak', 'doğa',
    'habitat', 'ekosistem', 'doğal', 'çevre', 'yaban', 'hayat', 'biyoloji', 'biyolojik',
    'topografya', 'yeryüzü', 'biyoçeşitlilik', 'jeoloji', 'jeolojik', 'doğal', 'kaynaklar',
    'iklim', 'hava', 'havadurumu', 'meteoroloji', 'havaolayı', 'bitki', 'bitkiörtüsü', 'ağaçlık',
    'otlak', 'boz', 'bozkurt', 'çorak', 'doğabilim', 'doğaüstü', 'kır', 'maden', 'tabiat',
    'yapı', 'çevre'
  ],
  hayvanlar: [
    'kedi', 'köpek', 'kuş', 'balık', 'at', 'tavşan', 'yılan', 'kurbağa', 'aslan', 'kaplan',
    'fil', 'zebra', 'geyik', 'ayı', 'kanguru', 'yunus', 'köpekbalığı', 'kartal', 'şahin', 'leylek',
    'ördek', 'kaz', 'baykuş', 'tavuk', 'horoz', 'inek', 'kuzu', 'keçi', 'domuz', 'tilki',
    'timsah', 'kaplumbağa', 'penguen', 'balina', 'suaygırı', 'gergedan', 'zürafa', 'sincap',
    'fare', 'kertenkele', 'akrep', 'örümcek', 'karınca', 'arı', 'kelebek', 'sinek', 'kurbağa',
    'yengeç', 'istakoz', 'ahtapot', 'midye', 'istiridye', 'yunus', 'kırlangıç', 'bülbül', 'serçe',
    'güvercin', 'baykuş', 'çakal', 'çita', 'panter', 'jaguar', 'vaşak', 'çakal', 'muhabbetkuşu',
    'kanarya', 'karga', 'leylek', 'turna', 'martı', 'pelikan', 'flamingo', 'swan', 'şahin',
    'atmaca', 'doğan', 'kukku', 'yavru', 'ağaçkakan', 'saksağan', 'sığırcık', 'sığırtmaç',
    'guguk', 'çulluk', 'çalıkuşu', 'keklik', 'toy', 'bıldırcın', 'sülün', 'turna', 'kaşıkçı',
    'pelikan', 'karabatak', 'dalgıç'
  ],
  yiyecekler: [
    'elma', 'muz', 'peynir', 'ekmek', 'çikolata', 'yoğurt', 'süt', 'yumurta', 'et', 'balık',
    'tavuk', 'domates', 'salatalık', 'biber', 'patlıcan', 'patates', 'soğan', 'sarımsak',
    'havuç', 'ıspanak', 'lahana', 'marul', 'kereviz', 'karnabahar', 'brokoli', 'mantar',
    'kabak', 'bakla', 'fasulye', 'bezelye', 'mercimek', 'nohut', 'pirinç', 'bulgur', 'makarna',
    'şehriye', 'un', 'maya', 'tuz', 'şeker', 'biber', 'kimyon', 'zencefil', 'zerdeçal',
    'tarçın', 'karanfil', 'kakule', 'nane', 'fesleğen', 'dereotu', 'maydanoz', 'roka',
    'tere', 'kereviz', 'pazı', 'turp', 'rezene', 'kişniş', 'kekik', 'lavanta', 'adaçayı',
    'biberiye', 'anason', 'hardal', 'keten', 'susam', 'haşhaş', 'çiğdem', 'yulaf', 'buğday',
    'arpa', 'çavdar', 'mısır', 'kavun', 'karpuz', 'çilek', 'kiraz', 'vişne', 'üzüm', 'şeftali',
    'erik', 'kayısı', 'armut', 'ayva', 'nar', 'incir', 'kivi', 'avokado', 'ananas', 'hindistancevizi',
    'papaya', 'mango', 'guava', 'liçi', 'dikenliincir', 'karadut', 'dut', 'ahududu', 'böğürtlen'
  ],
  filmler: [
    'Titanik', 'Yüzüklerin Efendisi', 'Harry Potter', 'Matrix', 'Gladyatör', 'Forrest Gump', 'Dövüş Kulübü', 
    'Inception', 'Pulp Fiction', 'The Dark Knight', 'Avatar', 'Interstellar', 'Star Wars', 'Yıldızlararası', 
    'Jaws', 'Jurassic Park', 'Terminatör', 'Alien', 'Piyanist', 'Yeşil Yol', 'Baba', 'Alacakaranlık', 
    'Örümcek Adam', 'Iron Man', 'Kaptan Amerika', 'Avengers', 'Sihirbazlar Çetesi', 'Parazit', 
    'Matrix', 'Indiana Jones', 'Rocky', 'Rambo', 'Korku Seansı', 'Kara Şövalye', 'Başlangıç', 
    'Hayalet Avcıları', 'Zor Ölüm', 'Hızlı ve Öfkeli', 'Çılgın Max', 'Korku Seansı', 'Aşk Tesadüfleri Sever', 
    'V For Vendetta', 'Prestij', 'Kayıp Şehir', 'Piyanist', 'Gece Nöbeti', 'Görevimiz Tehlike', 'Siccin', 
    'Kara Şövalye Yükseliyor', 'Babam ve Oğlum', 'Dedemin İnsanları', 'Mustang', 'Kelebeğin Rüyası', 
    'Şampiyon', 'Fetih 1453', 'Müslüm', 'Recep İvedik', 'Düğün Dernek', 'Ailecek Şaşkınız', 
    'G.O.R.A', 'Arif v 216', 'Hokkabaz', 'Vizontele', 'Kış Uykusu', 'Bir Zamanlar Anadolu’da', 
    'Kelebekler', 'Beynelmilel', 'Organize İşler', 'Çiçero', 'Hep Yek', 'Kocan Kadar Konuş', 
    'Eyyvah Eyvah', 'Çalgı Çengi', 'Hokkabaz', 'Issız Adam', 'Romantik Komedi', 'Şarkıcı', 
    'Gönül Yarası', 'Mutluluk', 'Dedemin Fişi', 'Ayla', '7. Koğuştaki Mucize', 'Cep Herkülü: Naim Süleymanoğlu', 
    'Nefes: Vatan Sağolsun', 'Dağ', 'Siccin', 'Baskın', 'Dabbe', 'Şeytan-i Racim', 'Musallat', 
    'Büyü', 'Azazil', 'Üç Harfliler', 'El-Cin', 'Cehennem'
  ],
  diziler: [
    'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Witcher', 'Dark', 'Friends', 
    'How I Met Your Mother', 'La Casa de Papel', 'Black Mirror', 'The Mandalorian', 'Sherlock', 
    'Dexter', 'The Office', 'Suits', 'Narcos', 'The Crown', 'The Walking Dead', 'Supernatural', 
    'Westworld', 'House of Cards', 'Mindhunter', 'Lost', 'Vikings', 'The Handmaid\'s Tale', 
    'Rick and Morty', 'Fargo', 'Peaky Blinders', 'Chernobyl', 'Mr. Robot', 'The Boys', 'True Detective', 
    'Brooklyn Nine-Nine', 'Better Call Saul', 'Mad Men', 'Big Bang Theory', 'The 100', 'Gossip Girl', 
    '13 Reasons Why', 'Prison Break', 'Sons of Anarchy', 'The Expanse', 'The Flash', 'Arrow', 
    'Legends of Tomorrow', 'Supergirl', 'Gotham', 'Lucifer', 'Daredevil', 'Jessica Jones', 'Punisher', 
    'Defenders', 'Ozark', 'House', 'Scrubs', 'Parks and Recreation', 'Community', 'New Girl', 
    'Modern Family', 'Two and a Half Men', 'True Blood', 'The Vampire Diaries', 'The Originals', 
    'Legacies', 'Stargate SG-1', 'Battlestar Galactica', 'Firefly', 'Doctor Who', 'Torchwood', 
    'Misfits', 'Merlin', 'Shadowhunters', 'The Umbrella Academy', 'A Series of Unfortunate Events', 
    'The Haunting of Hill House', 'Locke & Key', 'Sense8', 'The OA', 'Altered Carbon', 'Hannibal', 
    'Fringe', 'Westworld', 'Band of Brothers', 'The Pacific', 'Rome', 'Spartacus', 'Deadwood', 
    'Boardwalk Empire', 'True Detective', 'Big Little Lies', 'Sharp Objects', 'Killing Eve', 
    'The Night Manager', 'Bodyguard', 'Line of Duty', 'Broadchurch', 'Luther'
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adamasmaca')
    .setDescription('Adam Asmaca')
    .addStringOption(option =>
      option.setName('kategori')
        .setDescription('Kelime kategorisini seçin')
        .setRequired(true)
        .addChoices(
          { name: 'Doğa', value: 'doğa' },
          { name: 'Hayvanlar', value: 'hayvanlar' },
          { name: 'Yiyecekler', value: 'yiyecekler' },
          { name: 'filmler', value: 'filmler' },
          { name: 'diziler', value: 'diziler' }
        )),

  async execute(interaction) {
    try {
      const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
      const allowedChannelId = serverSettings?.game_channel;

      if (!allowedChannelId) {
          return interaction.reply({ content: "Oyun kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
      }

      if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
        const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
        return interaction.reply({ 
            content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Oyun"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
            ephemeral: true 
        });
    }

    const category = interaction.options.getString('kategori');
    const words = wordsByCategory[category];
    const randomWord = words[Math.floor(Math.random() * words.length)];

    const Game = new Hangman({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: `Adam Asmaca - Kategoriniz: ${category}`,
        color: '#5865F2'
      },
      hangman: { hat: '🎩', head: '😟', shirt: '👕', pants: '🩳', boots: '👞👞' },
      customWord: randomWord,
      timeoutTime: 60000,
      theme: category,
      winMessage: 'Kazandın! Kelime **{word}** idi.',
      loseMessage: 'Kaybettin! Kelime **{word}** idi.',
      playerOnlyMessage: 'Sadece {player} bu butonları kullanabilir.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      console.log(result);  // => { result... }
    });
  } catch (error) {
    console.error('adam asmaca oyunu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'adam asmaca oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}
  }
};
