const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType} = require('discord.js');
const reactor = require('../../Models/Reactor');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName('reactor')
    .setDescription('Emojilerle otomatik tepki verme sistemini kur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(command => 
        command.setName('setup')
        .setDescription('Otomatik tepki sistemini kur')
        .addStringOption(option => 
            option.setName('emoji')
            .setDescription('Hangi emojiyi kullanmak istersin')
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('emoji2')
            .setDescription('Hangi emojiyi kullanmak istersin')
            .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('channel')
            .setDescription('Hangi kanalda çalışacak')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(command => 
        command.setName('remove')
        .setDescription('Otomatik tepki sistemini **bir kanal için** kapat')
        .addChannelOption(option => 
            option.setName('channel')
            .setDescription('Hangi kanala uygulamak istersin')
            .setRequired(true)
        )
    )
    .addSubcommand(command => 
        command.setName('remove-all')
        .setDescription('otomatik tepki sistemini **sunucuda** kapat')
    ),

    async execute(interaction)
    {
        try {
            // Fetch server settings to get the allowed game channel ID
            const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
            const allowedChannelId = serverSettings?.reactor_channel;
    
            if (!allowedChannelId) {
                return interaction.reply({ content: "Tepki kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
            }
    
            if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
                const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
                return interaction.reply({ 
                    content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Tepki"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                    ephemeral: true 
                });
            }

        const {options, guild, member} = interaction;

        let channel = options.getChannel('channel');
        if(!channel)
            {
                channel = interaction.channel;
            }
            const sub = options.getSubcommand();
            const data = await reactor.findOne({Guild: guild.id, Channel: channel.id});

            switch(sub)
            {
                case 'setup':
                    if(data)
                        {
                            return interaction.reply({content: `${channel} kanalına zaten bir tepki sistemi kurulmuş`, ephemeral: true});
                        }
                        else 
                        {
                            const emoji = options.getString('emoji');
                            const emoji2 = options.getString('emoji2');
                            await reactor.create({
                            Guild: guild.id,
                            Channel: channel.id,
                            Emoji: emoji,
                            Emoji2: emoji2
                        });
                        const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`Tepki sistemi ${channel} kanalı için kurulmuştur.`)

                        await interaction.reply({embeds: [embed], ephemeral: true});
                        }
                        break;

                        case'remove':
                        if(!data)
                            {
                                return interaction.reply({content: `${channel} kanalına bir tepki sistemi kurulmamış`, ephemeral: true});
                            }
                            else
                            {
                                await reactor.deleteMany({Guild: guild.id, Channel: channel.id});

                                const embed = new EmbedBuilder()
                                .setColor('Blue')
                                .setDescription(`Tepki sistemi ${channel} kanalından kaldırılmıştır.`)

                                await interaction.reply({embeds: [embed], ephemeral: true});
                            }

                            break;

                            case'remove-all':
                            const removedata = await reactor.findOne({Guild: guild.id});
                            if(!removedata)
                                {
                                    return await interaction.reply({content: 'Bu sunucuya henüz bir tepki sistemi oluşturulmamış', ephemeral: true});
                                }
                                else
                                {
                                    await reactor.deleteMany({Guild: guild.id});

                                    const embed = new EmbedBuilder()
                                    .setColor('Green')
                                    .setDescription('Otomatik tepki sistemi, tüm sunucudan silinmiştir')

                                    await interaction.reply({embeds: [embed], ephemeral: true});
                                }
            }
        } catch (error) {
            console.error('reactor komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'reactor komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
}