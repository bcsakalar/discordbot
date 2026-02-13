const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Coin = require('../../Models/Coin');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoin')
        .setDescription('Belirli bir miktarda coin ekle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Coin eklenecek kullanıcı')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Eklenecek coin miktarı')
                .setRequired(true)),

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

        const targetUser = interaction.options.getUser('kullanici');
        const amount = interaction.options.getInteger('miktar');
        const userId = targetUser.id;

        let user = await Coin.findOne({ userId });

        if (!user) {
            user = new Coin({ userId });
        }

        user.coins += amount;
        await user.save();

        await interaction.reply(`${targetUser.username} kullanıcısına ${amount} coin eklendi. Şu an toplam ${user.coins} coin'i var.`);
    } catch (error) {
        console.error('Coin eklerken bir hata oluştu', error);
        await interaction.reply('Coin ekelrken bir hata oluştu');
    }
    }
};
