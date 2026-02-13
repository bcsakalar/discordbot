const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Schema = require('../../Models/Leave');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("goodbye")
        .setDescription('Goodbye Mesajı Ayarla')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(command => 
            command.setName('setup')
                .setDescription('Goodbye Mesajı Ayarla')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('Goodbye Mesajı Gönderilecek Kanalı Seç')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('goodbye-message')
                        .setDescription('Goodbye Mesajı')
                        .setRequired(false)
                )
        )
        .addSubcommand(command => 
            command.setName('remove')
                .setDescription('Goodbye Mesajı Kaldır')
        ),

    async execute(interaction) {
        const { options, guild } = interaction;
        const goodbyeChannel = options.getChannel('channel');
        const goodbyeMessage = options.getString('goodbye-message');
    
        if (!guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: 'Buna Yetkin Yok', ephemeral: true });
        }
    
        const sub = options.getSubcommand();
    
        try {
            switch (sub) {
                case 'setup':
                    let existingData = await Schema.findOne({ Guild: guild.id });
                    if (!existingData) {
                        const newGoodbye = new Schema({
                            Guild: guild.id,
                            Channel: goodbyeChannel.id,
                            Message: goodbyeMessage
                        });
                        await newGoodbye.save();
                        interaction.reply({ content: '☑️ Goodbye Mesajı Başarıyla Ayarlandı' });
                    } else {
                        interaction.reply({ content: 'Zaten bir goodbye mesajı ayarlanmış', ephemeral: true });
                    }
                    break;
    
                case 'remove':
                    let removedata = await Schema.findOne({ Guild: guild.id });
                    if (!removedata) {
                        interaction.reply({ content: 'Henüz bir goodbye mesaj sistemi oluşturulmamış', ephemeral: true });
                    } else {
                        await Schema.deleteMany({ Guild: guild.id });
                        interaction.reply({ content: '☑️ Goodbye Mesajı Başarıyla Kaldırıldı', ephemeral: true });
                    }
                    break;
    
                default:
                    interaction.reply({ content: 'Geçersiz komut', ephemeral: true });
            }
        } catch (error) {
            console.error('Hata:', error);
            interaction.reply({ content: 'Bir hata oluştu, daha sonra tekrar deneyin', ephemeral: true });
        }
    }
};