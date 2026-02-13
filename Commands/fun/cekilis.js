const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('çekiliş')
        .setDescription('Çekilişi yapan kişinin bulunduğu ses kanalındaki üyeler arasında çekiliş yapar.'),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.fun_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Eğlence kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Eğlence"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        // Çekilişi yapan kişinin bilgilerini alıyoruz
        const yapanKisi = interaction.member;

        // Eğer çekilişi yapan kişi ses kanalında değilse hata mesajı gönderiyoruz
        if (!yapanKisi.voice.channel) {
            return await interaction.reply({ content: 'Üzgünüz, çekilişi yapabilmek için ses kanalında olmalısınız.' });
        }

        // Çekilişi yapan kişinin bulunduğu ses kanalındaki üyeleri alıyoruz
        const sesKanaliUyeleri = yapanKisi.voice.channel.members;

        // Eğer ses kanalında başka kullanıcı yoksa hata mesajı gönderiyoruz
        if (sesKanaliUyeleri.size <= 1) {
            return await interaction.reply({ content: 'Üzgünüz, çekiliş yapabilmek için ses kanalınızda başka kullanıcı olmalı.' });
        }

        // Çekilişi yapan kişiyi dışında, ses kanalındaki diğer kullanıcılar arasından rastgele birini seçiyoruz
        const katilanlar = Array.from(sesKanaliUyeleri.filter(uye => uye.id !== yapanKisi.id).values());
        const kazananIndex = Math.floor(Math.random() * katilanlar.length);
        const kazanan = katilanlar[kazananIndex];

        // Kazanan üyeyi bildiriyoruz
        await interaction.reply({ content: `🎉 Tebrikler! Çekilişi kazanan: ${kazanan}` });
    } catch (error) {
        console.error('cekilis komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'cekilis komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
};