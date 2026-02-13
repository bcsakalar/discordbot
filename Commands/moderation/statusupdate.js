const {SlashCommandBuilder, PermissionFlagsBits, ActivityType, EmbedBuilder} = require('discord.js');
const { execute } = require('./unban');
const { options } = require('superagent');
const client = require('../..');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName('statusupdate')
    .setDescription('Botun durumunu güncelleyin')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand => 
        subcommand.setName('activity')
        .setDescription('Botun aktivitesini güncelleyin')
        .addStringOption(option => 
            option.setName('durum')
            .setDescription('Botun yeni aktivitesi')
            .setRequired(true)
            .addChoices(
                { name: 'Oynuyor', value: 'Oynuyor' },
                { name: 'İzliyor', value: 'İzliyor' },
                { name: 'Dinliyor', value: 'Dinliyor' },
                { name: 'Yayında', value: 'Yayında'}
            )
        )
        .addStringOption(option => 
            option.setName('aktivite-mesajı')
            .setDescription('Botun aktivite mesajı')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => 
        subcommand.setName('status')
        .setDescription('Botun durumunu güncelleyin')
        .addStringOption(option => 
            option.setName('durum')
            .setDescription('Botun yeni durumu')
            .setRequired(true)
            .addChoices(
                { name: 'Çevrimiçi', value: 'online' },
                { name: 'Çevrimdışı', value: 'invisible' },
                { name: 'Rahatsız Etmeyin', value: 'dnd' },
                { name: 'Boşta', value: 'idle'}
            )
        )
    ),

    async execute(interaction)
    {
        try {
            
            if (!client.application?.owner) await client.application?.fetch();
        
        if (interaction.user.id !== client.application.owner.id) {
            return interaction.reply({ content: "Bu komutu sadece bot sahibi kullanabilir.", ephemeral: true });
        }

            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.moderation_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Modearasyon kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Moderasyon"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const {options} = interaction;
        const sub = options.getSubcommand(["activity", "status"]);
        const type = options.getString('durum');
        const activity = options.getString('aktivite-mesajı');

        try{
            switch(sub)
            {
                case "activity":
                    switch(type)
                    {
                        case "Oynuyor":
                            client.user.setActivity(activity, { type: ActivityType.Playing});
                            break;
                            case "İzliyor":
                                client.user.setActivity(activity, { type: ActivityType.Watching});
                                break;
                                case "Dinliyor":
                                    client.user.setActivity(activity, { type: ActivityType.Listening});
                                    break;
                                    case "Yayında":
                                        client.user.setActivity(activity, { type: ActivityType.Streaming});
                                        break;
                    }

                    case "status":
                        client.user.setPresence({status: type});
                        break;
            }
        }
        catch(err)
        {
            console.log(err);
        }
        const embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription('Başarılı bir şekilde botun durumları güncellenmiştir');

        await interaction.reply({embeds: [embed]});
    } catch (error) {
        console.error('statusupdate komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'statusupdate komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
}