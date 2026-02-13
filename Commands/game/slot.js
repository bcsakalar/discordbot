const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../Models/Coin'); // Ensure this path points correctly to your user model
const ServerSettings = require('../../Models/ServerSettings');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Slot oyunu')
        .addIntegerOption(option => 
            option.setName('bet')
                .setDescription('Betinizi giriniz, eğer slot ve blackjack oyununa yeni başlıyosanız 1000 coininiz var.')
                .setRequired(true)),

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

        const betAmount = interaction.options.getInteger('bet');
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
            return interaction.reply({ content: '**Yetersiz coin**', ephemeral: true });
        }

        // Deduct the bet amount
        user.coins -= betAmount;
        await user.save();

        // Slot machine symbols
        const symbols = ['🍇', '🍊', '🍋', '🍌'];
        
        // Function to create a random slot row
        const getRandomRow = () => {
            return Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]).join(' | ');
        };

        // Simulate slot machine animation
        const sendAnimation = async (embed) => {
            for (let i = 0; i < 3; i++) {
                embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n${getRandomRow()}\n${getRandomRow()}\n${getRandomRow()}`);
                await interaction.editReply({ embeds: [embed] });
                await new Promise(res => setTimeout(res, 500)); // Wait 500ms between frames
            }
        };

        const initialEmbed = new EmbedBuilder()
            .setTitle('Slot Makinesi')
            .setColor('#5865F2')
            .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n🍇 | 🍊 | 🍋\n🍇 | 🍊 | 🍋\n🍇 | 🍊 | 🍋`)
            .setFooter({ text: `Toplam coin: ${user.coins}` });

        await interaction.reply({ embeds: [initialEmbed] });
        await sendAnimation(initialEmbed);

        // Final result
        const result = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
        const resultString = result.join(' | ');

        // Check if the user has won
        const isWin = result[0] === result[1] && result[1] === result[2];

        let finalEmbed;

        if (isWin) {
            const winnings = betAmount * 5;
            user.coins += winnings;

            finalEmbed = new EmbedBuilder()
                .setTitle('Kazandınız!')
                .setColor('Green')
                .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n${resultString}\n\nTebrikler! ${winnings} coin kazandınız!`)
                .setFooter({ text: `Toplam coin: ${user.coins}` });
        } else {
            finalEmbed = new EmbedBuilder()
                .setTitle('Kaybettiniz!')
                .setColor('Red')
                .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n${resultString}\n\n${betAmount} coin kaybettiniz.`)
                .setFooter({ text: `Toplam coin: ${user.coins}` });
        }

        await user.save();

        // Send the final result
        await interaction.editReply({ embeds: [finalEmbed] });
    } catch (error) {
        console.error('slot oyunu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'slot oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
    }
};
