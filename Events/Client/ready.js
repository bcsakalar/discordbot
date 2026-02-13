require('dotenv').config();
const mongoose = require('mongoose');
const Levels   = require('discord.js-leveling');

const RoleAddModel    = require('../../Models/RoleAdd');
const RoleRemoveModel = require('../../Models/RoleRemove');
const scheduleRoleAdd    = require('../../Functions/scheduleRoleAdd');
const scheduleRoleRemove = require('../../Functions/scheduleRoleRemove');
const { restoreReactionCollector } = require('../../Commands/tools/animalrolver');
const { restoreHogwartsCollector } = require('../../Commands/tools/hogwartsrolver');
const { restoreGenderCollector }   = require('../../Commands/tools/genderrolver');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI tanımlı değil!');
      return;
    }

    mongoose.set('strictQuery', false);
    mongoose.connection.on('connected',   () => console.log('✅ MongoDB bağlı'));
    mongoose.connection.on('reconnected', () => console.log('🔁 MongoDB yeniden bağlandı'));
    mongoose.connection.on('disconnected',() => console.warn('⚠️ MongoDB bağlantısı koptu'));
    mongoose.connection.on('error', err   => console.error('❌ MongoDB hata:', err));

    const connectWithRetry = async (attempt = 1) => {
      try {
        await mongoose.connect(uri);
      } catch (err) {
        const delay = Math.min(30_000, attempt * 2_000);
        console.error(`❌ MongoDB bağlanamadı (deneme ${attempt}): ${err.message}`);
        setTimeout(() => connectWithRetry(attempt + 1), delay);
        return;
      }

      try {
        Levels.setURL(uri);
      } catch (e) {
        console.error('discord.js-leveling setURL hatası:', e);
      }

      try {
        restoreReactionCollector(client);
        restoreHogwartsCollector(client);
        restoreGenderCollector(client);
        console.log('♻️ Kolektörler restore edildi.');
      } catch (e) {
        console.error('Kolektör restore hatası:', e);
      }

      console.log(`🤖 ${client.user.tag} aktif ve hazır!`);

      try {
        const [adds, removes] = await Promise.all([
          RoleAddModel.find().lean().catch(() => []),
          RoleRemoveModel.find().lean().catch(() => []),
        ]);

        for (const r of adds) {
          if (!r?.UserId || !r?.RoleId || !r?.GuildId || !r?.ExpiresAt) continue;
          scheduleRoleAdd(client, r.UserId, r.RoleId, r.GuildId, new Date(r.ExpiresAt));
        }
        for (const r of removes) {
          if (!r?.UserId || !r?.RoleId || !r?.GuildId || !r?.ExpiresAt) continue;
          scheduleRoleRemove(client, r.UserId, r.RoleId, r.GuildId, new Date(r.ExpiresAt));
        }

        console.log(`🗓️ Zamanlayıcı restore: +${adds.length} add, +${removes.length} remove görev yüklendi.`);
      } catch (e) {
        console.error('⛔ Zamanlanmış görevler restore edilirken hata:', e);
      }
    };

    process.once('SIGINT', async () => {
      try { await mongoose.connection.close(); } catch {}
      process.exit(0);
    });

    connectWithRetry();
  }
};
