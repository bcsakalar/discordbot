# ICARDI — Discord Bot

Sunucunuzda oyun, eğlence, moderasyon, çekiliş, ticket, seviye sistemi ve daha fazlasını sunan **uçtan uca** çalışan bir Discord botu.

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari (Uçtan Uca Akış)](#-mimari-uçtan-uca-akış)
- [Proje Yapısı](#-proje-yapısı)
- [Veri Katmanı (MongoDB Modelleri)](#-veri-katmanı-mongodb-modelleri)
- [Olaylar (Events) Akışı](#-olaylar-events-akışı)
- [Komut Kategorileri](#-komut-kategorileri)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Web Arayüzü](#-web-arayüzü)
- [Lisans](#-lisans)

---

## 🎯 Genel Bakış

**ICARDI** (paket adı: `tifabot`), Discord sunucuları için:

- **Oyunlar**: Blackjack, slot, rulet, 2048, adam asmaca, mayın tarlası, taş-kağıt-makas, xox, yılan vb.
- **Eğlence**: 8ball, şakalar, slap, çeşitli eğlence komutları
- **Moderasyon**: Ban, kick, mute, slowmode, hoş geldin/hoşçakal, avatar, clear
- **Çekiliş**: Süreli çekiliş başlatma, bitirme, tepki ile katılım
- **Ticket**: Buton ile ticket açma, kapatma, kilitleme, talep etme, HTML transcript
- **Seviye (XP)**: Mesaj başına XP, seviye rolleri, leaderboard, rank
- **Anket**: 👍/👎 oylama, bitiş süresi, oy listesi
- **Reactor**: Belirli kanallarda her mesaja otomatik emoji tepkisi
- **Rol araçları**: Hayvan/Hogwarts/Cinsiyet rol menüleri, geçici rol ekleme/çıkarma
- **Bilgi**: Hava durumu, saat dilimi, bot bilgisi, uptime, haber
- **Instagram**: Reels bildirimi, kanal ayarı
- **Valorant**: Eğlence komutları (radiaim, comp, spin)

gibi özellikleri tek bir botta toplar. Kanal bazlı kısıtlamalar **ServerSettings** ile yönetilir; bot ilk eklendiğinde sistem kanalına kurulum mesajları gönderilir.

---

## 🛠 Teknoloji Yığını

| Bileşen | Teknoloji |
|--------|-----------|
| **Runtime** | Node.js |
| **Discord API** | discord.js v14 |
| **Veritabanı** | MongoDB (mongoose) |
| **Seviye Sistemi** | discord.js-leveling |
| **Oyunlar** | discord-gamecord, özel blackjack/slot/rulet |
| **Transcript** | discord-html-transcripts |
| **Profil Görseli** | discord-arts |
| **Yapılandırma** | dotenv |

---

## 🏗 Mimari (Uçtan Uca Akış)

### 1. Başlangıç (`index.js`)

```
dotenv yükle → Discord Client oluştur (intents/partials) → client.commands = Collection
→ client.login(DISCORD_BOT_TOKEN)
→ loadEvents(client) + loadCommands(client)
→ ClientReady: MongoDB bağlantısı, Level URL, kolektör restore, zamanlanmış rol görevleri
```

- **Intent’ler**: Guilds, GuildMembers, GuildMessages, MessageContent, GuildMessageReactions, GuildModeration, GuildVoiceStates  
- **Partials**: User, Message, GuildMember, ThreadMember, Channel, DirectMessages, Reaction  
- Komutlar `Commands/` altındaki klasörlerden taranır; `data.name` ve `execute` olanlar `client.commands` ve global slash komutlarına eklenir.

### 2. Komut Çalıştırma

- Kullanıcı slash komut kullanır → **interactionCreate** (ChatInputCommand) tetiklenir.
- `interactionCreate.js`: `client.commands.get(interaction.commandName)` ile komut bulunur → `command.execute(interaction, client)` çağrılır.
- Birçok komut **ServerSettings** ile `guildId` üzerinden ilgili kanalı kontrol eder (örn. `game_channel`, `cekilis_channel`). Kanal ayarlı değilse veya komut yanlış kanaldaysa uyarı verilir (isteğe bağlı “tüm kanallar” için `all_channels` desteklenir).

### 3. Mesaj Akışı (XP & Seviye)

- **messageCreate**: Bot veya DM değilse ve mesaj 3+ karakter ise `Levels.appendXp(authorId, guildId, randomXP)` çağrılır.
- Seviye atlanırsa: **LevelRoles** modelinden sunucuya ait seviye–rol eşlemesi alınır; kullanıcı seviyesi eşleşiyorsa rol verilir ve kanala “Yeni seviye” embed’i gönderilir.

### 4. Çekiliş Akışı

- **cekilis-baslat**: Ödül, süre (dakika), kazanan sayısı alınır → embed + 🎉 tepkisi gönderilir → **Giveaway** modelinde kayıt oluşturulur → `setTimeout` ile süre sonunda `endGiveaway` çalışır.
- **messageReactionAdd**: Tepki 🎉 ise ve mesaj bir çekiliş mesajıysa kullanıcı `participants` listesine eklenir (DM bilgilendirmesi yapılır).
- Bitişte kazananlar seçilir, mesaj güncellenir, giveaway `ended: true` yapılır / silinir.

### 5. Anket (Poll) Akışı

- **index.js** içinde `InteractionCreate` + buton: `customId` `up` / `down` / `votes`. **Votes** modelinden `Msg` ile anket bulunur; süre kontrolü yapılır; oy verenler `UpMembers`/`DownMembers` ile takip edilir; embed ve butonlar güncellenir.

### 6. Reactor

- **index.js** içinde `MessageCreate`: **Reactor** modelinde `Guild` + `Channel` eşleşmesi varsa, bot değilse her mesaja `data.Emoji` ve `data.Emoji2` tepkileri eklenir.

### 7. Ticket Akışı

- **ticketsetup**: Ticket kanalında butonlar tanımlanır; **Ticketsetup** modelinde GuildID, Buttons, Handlers, Everyone, Transcripts saklanır.
- **ticketResponse.js**: Bu butonlardan biri tıklanınca yeni kanal açılır, **Ticket** modelinde kayıt oluşturulur; kanala kapat/kilitle/aç/talep butonları gönderilir.
- **ticketAction.js**: Kapat → HTML transcript oluşturulur, Transcripts kanalına gönderilir, kullanıcıya DM ile link iletilir, kanal silinir. Kilitle/aç → izinler güncellenir. Talep → Claimed/ClaimedBy güncellenir.

### 8. Hoş Geldin / Ayrılış

- **guildMemberAdd**: **Welcome** modelinden kanal ve mesaj alınır; discord-arts ile profil görseli üretilir; embed gönderilir; varsa rol verilir (pending ise gecikmeli deneme).
- **guildMemberLeave**: **Leave** modeline göre ayrılan üye kanalında mesaj gönderilir.

### 9. Sunucu Ayarları (Kanal Seçimi)

- **guildCreate**: Sunucuya eklenince sistem kanalına (veya yazılabilir ilk metin kanalına) hoş geldin embed’i ve her ayar tipi için **StringSelectMenu** (Oyun, Eğlence, Çekiliş, Bilgi, Level, Moderasyon, Araçlar, Anket, Reactor, Ticket) gönderilir.
- **interactionCreatee.js**: `select_*` menülerinden seçim yapılınca **ServerSettings** `findOneAndUpdate` ile ilgili alan güncellenir (`game_channel`, `fun_channel`, vb. veya `all_channels`).

### 10. Geçici Rol & Zamanlayıcı

- **RoleAdd** / **RoleRemove** modellerinde `UserId`, `RoleId`, `GuildId`, `ExpiresAt` tutulur.
- **ready.js**: MongoDB bağlandıktan sonra bu kayıtlar okunur; `scheduleRoleAdd` / `scheduleRoleRemove` ile zamanlanmış görevler atanır (restart sonrası devam eder).

Bu akışlar birlikte botun **uçtan uca** davranışını oluşturur: giriş → komut/event handler’lar → MongoDB modelleri → Discord API yanıtları.

---

## 📁 Proje Yapısı

```
discordbot/
├── index.js                 # Giriş noktası, client, reactor/poll dinleyicileri
├── package.json
├── .env                     # DISCORD_BOT_TOKEN, MONGO_URI (git’e eklenmez)
├── .gitignore
├── Handlers/
│   ├── commandHandler.js    # Commands/ altındaki slash komutlarını yükler
│   └── eventHandler.js      # Events/ altındaki event’leri yükler
├── Commands/                # Slash komutları (kategori klasörleri)
│   ├── cekilis/             # cekilis-baslat, cekilis-bitir, cekilis-süre
│   ├── fun/                 # 8ball, joke, slap, özel eğlence komutları
│   ├── game/                # blackjack, slot, rulet, 2048, daily, coin vb.
│   ├── info/                # botinfo, help, memberinfo, news, timezone, uptime, weather
│   ├── instagram/           # instareels, setinstachannel
│   ├── levels/              # leaderboard, level, rank, xp, setlevelroles vb.
│   ├── moderation/          # ban, kick, mute, welcome, goodbye, clear vb.
│   ├── moderationrole/      # temproleadd, temproleremove
│   ├── poll/                # poll
│   ├── reactor/             # reactor
│   ├── ticket/              # ticketsetup
│   ├── tools/               # animalrolver, genderrolver, hogwartsrolver, meme, say, timer, updateChannels vb.
│   └── valorant/            # radiaim, valorantcomp, valorantspin
├── Events/
│   ├── Client/
│   │   └── ready.js         # MongoDB, level URL, kolektör/zamanlayıcı restore
│   ├── Guild/
│   │   ├── guildCreate.js   # Kurulum mesajları + kanal seçim menüleri
│   │   ├── guildMemberAdd.js
│   │   ├── guildMemberLeave.js
│   │   └── guildMemberUpdate.js
│   ├── Interactions/
│   │   ├── interactionCreate.js   # Slash + "roller" select menu
│   │   └── interactionCreatee.js # Kanal ayarı select menüleri → ServerSettings
│   ├── Messages/
│   │   └── messageCreate.js # XP + seviye rolü
│   ├── Giveawaymessagereactionadd/
│   │   └── messageReactionAdd.js # Çekilişe katılım
│   └── Ticket/
│       ├── ticketAction.js   # Kapat, kilitle, aç, talep
│       └── ticketResponse.js # Yeni ticket kanalı oluşturma
├── Functions/
│   ├── scheduleRoleAdd.js
│   └── scheduleRoleRemove.js
├── Models/                  # Mongoose şemaları
│   ├── AnimalRoles.js
│   ├── Coin.js
│   ├── GenderRoles.js
│   ├── Giveaway.js
│   ├── HogwartsRoles.js
│   ├── Leave.js
│   ├── LevelRoles.js
│   ├── Reactor.js
│   ├── RoleAdd.js
│   ├── RoleRemove.js
│   ├── Score.js
│   ├── ServerSettings.js
│   ├── Ticket.js
│   ├── Ticketsetup.js
│   ├── userTaskSchema.js
│   ├── serverTaskSchema.js
│   ├── Votes.js
│   └── Welcome.js
└── public/                  # Web arayüzü (opsiyonel)
    ├── index.html
    ├── commands.html
    ├── css/
    └── images/
```

---

## 🗄 Veri Katmanı (MongoDB Modelleri)

| Model | Amaç |
|-------|------|
| **ServerSettings** | Sunucu bazlı kanal ayarları: game_channel, fun_channel, cekilis_channel, info_channel, levels_channel, moderation_channel, tools_channel, poll_channel, reactor_channel, ticket_channel, kick_notification_channel, insta_notification_channel |
| **Coin** | Kullanıcı bazlı coin (varsayılan 1000), lastDaily |
| **Score** | Oyun skorları (userId, username, score) |
| **Giveaway** | Çekiliş: channelId, messageId, prize, endTime, participants, winnerCount, ended |
| **Votes** | Anket: Msg, Upvote, Downvote, UpMembers, DownMembers, Guild, Owner, EndTime |
| **LevelRoles** | guildId, levelRoles (Map: seviye → rol ID) |
| **Welcome** | Hoş geldin: Guild, Channel, Msg, Role |
| **Leave** | Ayrılış kanalı ve mesajı |
| **Reactor** | Guild, Channel, Emoji, Emoji2 |
| **Ticket** | GuildID, MembersID, ChannelID, TicketID, Closed, Locked, Type, Claimed, ClaimedBy |
| **Ticketsetup** | GuildID, Buttons, Handlers, Everyone, Transcripts |
| **RoleAdd / RoleRemove** | Geçici rol: UserId, RoleId, GuildId, ExpiresAt |
| **AnimalRoles, GenderRoles, HogwartsRoles** | Rol menüsü mesaj/kanal bilgileri (reaction collector restore için) |

Seviye/XP verisi **discord.js-leveling** kütüphanesi tarafından aynı MongoDB bağlantısı üzerinde yönetilir (`Levels.setURL(uri)` ready’de ayarlanır).

---

## ⚡ Olaylar (Events) Akışı

| Event | Dosya | Özet |
|-------|--------|------|
| **ready** | Client/ready.js | MongoDB bağlantısı, Level URL, reaction collector restore, RoleAdd/RoleRemove zamanlayıcı restore |
| **guildCreate** | Guild/guildCreate.js | Varsayılan kanala hoş geldin + tüm kanal ayar menüleri (StringSelectMenu) |
| **guildMemberAdd** | Guild/guildMemberAdd.js | Welcome kanalına embed + profil görseli, isteğe bağlı rol |
| **guildMemberLeave** | Guild/guildMemberLeave.js | Ayrılan üye mesajı |
| **messageCreate** | Messages/messageCreate.js | XP ekleme, seviye atlama ve rol verme |
| **interactionCreate** | Interactions/interactionCreate.js | Slash komut çalıştırma, "roller" select menu (rol ekleme/çıkarma) |
| **interactionCreate** | Interactions/interactionCreatee.js | select_* menüleri → ServerSettings güncelleme |
| **interactionCreate** | Ticket/ticketResponse.js | Ticket açma butonu → yeni kanal + Ticket kaydı |
| **interactionCreate** | Ticket/ticketAction.js | Kapat / kilitle / aç / talep butonları |
| **messageReactionAdd** | Giveawaymessagereactionadd/messageReactionAdd.js | Çekilişe 🎉 ile katılım |

Ek olarak **index.js** içinde: reactor (MessageCreate), anket butonları (InteractionCreate, up/down/votes) doğrudan dinlenir.

---

## 📌 Komut Kategorileri

- **cekilis**: cekilis-baslat, cekilis-bitir, cekilis-sure  
- **fun**: 8ball, arduino, cekilis, joke, slap ve özel eğlence komutları  
- **game**: 2048, adamasmaca, addcoin, blackjack, coininfo, daily, mayintarlasi, rulet, slot, taskagitmakas, xox, yilan  
- **info**: botinfo, help, memberinfo, news, timezone, uptime, weather  
- **instagram**: instareels, setinstachannel  
- **levels**: leaderboard, level, listlevelroles, rank, remain, removelevelroles, setlevelroles, xp  
- **moderation**: avatar, ban, banner, goodbye, kick, mass-unban, mute, slowmode, statusupdate, unban, unmute, welcome  
- **moderationrole**: temproleadd, temproleremove  
- **poll**: poll  
- **reactor**: reactor  
- **ticket**: ticketsetup  
- **tools**: animalrolver, clear, clearbot, emojizoom, genderrolver, hogwartsrolver, meme, movie, notes, quickabdest, say, series, timer, updateChannels (ayar_kanal_guncelle)  
- **valorant**: radiaim, valorantcomp, valorantspin  

Help komutu (`/help`) kategori seçim menüsü ve davet linki sunar; `kick` ve `instagram` kategorileri listeden çıkarılabilir.

---

## 🚀 Kurulum

1. **Gereksinimler**: Node.js (v18+ önerilir), MongoDB (yerel veya Atlas).

2. **Bağımlılıkları yükle**:
   ```bash
   npm install
   ```

3. **Ortam değişkenleri**: Proje kökünde `.env` oluştur (bkz. aşağı).

4. **Çalıştırma**:
   ```bash
   npm start
   ```
   Geliştirme için:
   ```bash
   npm run dev
   ```
   (nodemon ile otomatik yeniden başlatma)

5. **Discord Developer Portal**: Bot token’ı alın, Message Content Intent ve gerekli Privileged Gateway Intents açık olsun. Slash komutlar bot başlarken `client.application.commands.set(commandsArray)` ile kaydedilir.

---

## 🔐 Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DISCORD_BOT_TOKEN` | Discord bot token’ı (zorunlu) |
| `MONGO_URI` | MongoDB bağlantı URI’si (zorunlu; ready’de Levels.setURL için de kullanılır) |

`.env` dosyası `.gitignore` ile versiyon kontrolüne eklenmez; örnek için `.env.example` ekleyebilirsiniz.

---

## 🌐 Web Arayüzü

`public/` klasöründe statik bir tanıtım sayfası bulunur:

- **index.html**: Ana sayfa, özellikler, davet linki.
- **commands.html**: Komutlar sayfası.
- **css/style.css**, **images/**: Stil ve görseller.

Bu sayfalar bir HTTP sunucusu (örn. Express) ile sunulmadığı sürece bot ile birlikte otomatik açılmaz; isteğe bağlı olarak ayrı bir web sunucusu ile host edilebilir.

---

## 📄 Lisans

ISC (package.json’da belirtilmiştir).

---

**Özet**: Bu README, projenin giriş noktasından Discord ve MongoDB ile etkileşime, event ve komut akışına, modellere ve kuruluma kadar **uçtan uca** sistemi açıklar. Yeni özellik veya komut eklerken `Handlers` + `Commands/` veya `Events/` + `Models/` yapısı takip edilmelidir.
