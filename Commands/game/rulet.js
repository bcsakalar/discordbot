const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../Models/Coin'); // Ensure this path points correctly to your user model
const ServerSettings = require('../../Models/ServerSettings');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('rulet')
        .setDescription('Rulet oyunu')
        .addIntegerOption(option => 
            option.setName('bahis')
                .setDescription('Bahis miktarınızı giriniz.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('renk')
                .setDescription('Bahis renginizi seçin: (red) (black)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('sayi')
                .setDescription('Bahis yapacağınız sayıyı girin: (0-36)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Fetch server settings to get the allowed game channel ID
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

        let betAmount = interaction.options.getInteger('bahis');
        const betColor = interaction.options.getString('renk');
        const betNumber = interaction.options.getInteger('sayi');
        const userId = interaction.user.id;

        // Fetch user data from the database
        let user = await User.findOne({ userId });

        // If user doesn't exist, create a new one
        if (!user) {
            user = new User({ userId, coins: 1000 });  // Assume starting coins is 1000
            await user.save();
        }

        // Check if user has enough points
        if (user.coins < betAmount) {
            return interaction.reply({ content: '**Yetersiz coininiz var!**', ephemeral: true });
        }

        // Deduct the bet amount
        user.coins -= betAmount;
        await user.save();

        // Roulette game setup
        const wheel = Array.from({ length: 37 }, (_, i) => i); // 0-36
        const spinResults = [];
        const spinCount = 10;

        for (let i = 0; i < spinCount; i++) {
            spinResults.push(wheel[Math.floor(Math.random() * wheel.length)]);
        }

        // Animation setup
        const embed = new EmbedBuilder()
            .setTitle('Rulet')
            .setColor('#5865F2')
            .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n**Rulet dönüyor...**`);

        await interaction.reply({ embeds: [embed] });

        for (let i = 0; i < spinResults.length; i++) {
            setTimeout(async () => {
                const interimResult = spinResults[i];
                const interimColor = getColor(interimResult);

                embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n**Rulet dönüyor...**\n**Sonuç:** ${interimResult} ${interimColor.toUpperCase()}`);
                await interaction.editReply({ embeds: [embed] });

                if (i === spinResults.length - 1) {
                    const result = interimResult;
                    const color = interimColor;

                    embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n**Sonuç:** ${result} ${color.toUpperCase()}`);
                    embed.setFooter({ text: `Toplam coin: ${user.coins}` });

                    // Determine if the user won
                    let won = false;
                    let winnings = 0;

                    if (betColor && betColor === color) {
                        won = true;
                        winnings += betAmount * 2; // Color bet pays 2:1
                    }
                    if (betNumber !== null && parseInt(betNumber) === result) {
                        won = true;
                        winnings += betAmount * 35; // Number bet pays 35:1
                    }

                    if (won) {
                        user.coins += winnings;
                        embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n**Sonuç:** ${result} ${color.toUpperCase()}\n**Tebrikler! ${winnings} coin kazandınız!**`);
                    } else {
                        embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n**Sonuç:** ${result} ${color.toUpperCase()}\n**Üzgünüz! ${betAmount} coin kaybettiniz.**`);
                    }

                    embed.setFooter({ text: `Toplam coin: ${user.coins}` });

                    await user.save();
                    await interaction.editReply({ embeds: [embed] });
                }
            }, 300 * (i + 1));
        }
    } catch (error) {
        console.error('rulet oyunu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'rulet oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};

function getColor(number) {
    if (number === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'red' : 'black';
}
