const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const weather = require('weather-js');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName('hava-durumu')
    .setDescription('Hava Durumu')
    .addStringOption(option => 
        option.setName('lokasyon')
        .setDescription('Hava durumuna bakmak istediğin lokasyon')
        .setRequired(true)
    )
    .addStringOption(option => 
        option.setName('derece-tipi')
        .setDescription('Sıcaklık birimi (Celsius, Fahrenheit)')
        .addChoices(
            {name: 'Celcius', value: 'C' },
            {name: 'Fahrenheit', value: 'F' }
        )
        .setRequired(true)
    ),

    async execute(interaction)
    {
        try {
        const {options} = interaction;
        const location = interaction.options.getString('lokasyon');
        const degree = interaction.options.getString('derece-tipi');

        await interaction.reply({content: '☁️ Hava durumu bilgisi getiriliyor...'});

        await weather.find({search: `${location}`, degreeType: `${degree}`}, async function(err, result)
    {
        setTimeout(() => 
        {
            if(err)
                {
                    console.log(err);
                    interaction.editReply({content: `${err} | Komut zaman aşımına uğradı. lütfen tekrar deneyiniz.`});
                }
                else
                {
                    if(result.lenght == 0)
                        return interaction.editReply({content: `${location} bölgesine ait bir hava durumu bulunamdı`});
                    else
                    {
                        const temp = result[0].current.temperature;
                        const feel = result[0].current.feelslike;
                        const type = result[0].current.skytext;
                        const name = result[0].location.name;
                        const icon = result[0].current.imageUrl;
                        const wind = result[0].current.winddisplay;
                        const humidity = result[0].current.humidity;
                        const alert = result[0].location.alert || "Uyarı yok";

                        const embed = new EmbedBuilder()
                        .setColor("Blue")
                        .setDescription(`****${type}****`)
                        .setTitle(`${name} bölgesinin Hava Durumu`)
                        .addFields({name: 'Derece', value: `${temp}`, inline: true})
                        .addFields({name: 'Hissedilen', value: `${feel}`, inline: true})
                        .addFields({name: 'Mevcut Uyarılar', value: `${alert}`, inline: true})
                        .addFields({name: 'Rüzgar Hızı & Yönü', value: `${wind}`, inline: true})
                        .addFields({name: 'Nem', value: `${humidity}%`, inline: true})
                        .setThumbnail(icon)

                        interaction.editReply({content: "", embeds: [embed]});
                    }
                }
        }, 2000)
    })
} catch (error) {
    console.error('weather komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'weather komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}

    }
}