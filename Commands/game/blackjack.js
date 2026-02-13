const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../Models/Coin'); // Ensure this path points correctly to your user model
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Blackjack oyunu')
        .addIntegerOption(option => 
            option.setName('bet')
                .setDescription('Betinizi giriniz, eğer slot ve blackjack oyununa yeni başlıyosanız 1000 coininiz var.')
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

        let betAmount = interaction.options.getInteger('bet');
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

        // Blackjack game setup
        const deck = shuffleDeck(createDeck());
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Çek')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Kal')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('double')
                    .setLabel('Double')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('split')
                    .setLabel('Böl')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(playerHand[0].slice(0, -1) !== playerHand[1].slice(0, -1) || user.coins < betAmount),
                new ButtonBuilder()
                    .setCustomId('insurance')
                    .setLabel('Sigorta')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(dealerHand[0].slice(0, -1) !== 'A' || user.coins < betAmount / 2)
            );

        const embed = new EmbedBuilder()
            .setTitle('Blackjack')
            .setColor('#5865F2')
            .addFields(
                { name: 'Kurpiyer', value: `${dealerHand[0]} | ❓` },
                { name: 'Oyuncu', value: `${playerHand.join(' | ')}` }
            )
            .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n**Kazanmak için 21'e yakın olmaya çalışın!**`)
            .setFooter({ text: `Toplam coin: ${user.coins}` });

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === userId;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

        let splitHand = null;
        let playingSplitHand = false;
        let insuranceBet = 0;

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                const hand = playingSplitHand ? splitHand : playerHand;
                hand.push(deck.pop());
                if (calculateHand(hand) > 21) {
                    if (playingSplitHand) {
                        await endGame('lose', true);
                    } else if (splitHand) {
                        playingSplitHand = true;
                        await updateEmbed(i, embed, splitHand, dealerHand, betAmount, user.coins, true);
                    } else {
                        await endGame('lose');
                    }
                } else {
                    await updateEmbed(i, embed, playerHand, dealerHand, betAmount, user.coins);
                }
            } else if (i.customId === 'stand') {
                if (playingSplitHand) {
                    await endGame(calculateResult(splitHand, dealerHand), true);
                } else if (splitHand) {
                    playingSplitHand = true;
                    await updateEmbed(i, embed, splitHand, dealerHand, betAmount, user.coins, true);
                } else {
                    while (calculateHand(dealerHand) < 17) {
                        dealerHand.push(deck.pop());
                    }
                    await endGame(calculateResult(playerHand, dealerHand));
                }
            } else if (i.customId === 'double') {
                if (user.coins < betAmount) {
                    return i.reply({ content: '**Yetersiz coininiz var!**', ephemeral: true });
                }
                user.coins -= betAmount;
                await user.save();
                playerHand.push(deck.pop());
                betAmount *= 2;
                if (calculateHand(playerHand) > 21) {
                    await endGame('lose');
                } else {
                    while (calculateHand(dealerHand) < 17) {
                        dealerHand.push(deck.pop());
                    }
                    await endGame(calculateResult(playerHand, dealerHand));
                }
            } else if (i.customId === 'split') {
                if (user.coins < betAmount) {
                    return i.reply({ content: '**Yetersiz coininiz var!**', ephemeral: true });
                }
                splitHand = [playerHand.pop()];
                playerHand.push(deck.pop());
                splitHand.push(deck.pop());
                user.coins -= betAmount;
                await user.save();
                await updateEmbed(i, embed, playerHand, dealerHand, betAmount, user.coins);
            } else if (i.customId === 'insurance') {
                insuranceBet = betAmount / 2;
                user.coins -= insuranceBet;
                await user.save();

                if (calculateHand(dealerHand) === 21) {
                    const insuranceWinnings = insuranceBet * 2;
                    user.coins += insuranceWinnings;
                    await endGame('lose');
                    return;
                } else {
                    await i.update({ content: '**Kurpiyer blackjack yapmadı. Oyuna devam edin.**', components: [row], embeds: [embed] });
                }
            }
        });

        async function updateEmbed(interaction, embed, playerHand, dealerHand, betAmount, coins, isSplit = false) {
            embed.setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n**Kazanmak için 21'e yakın olmaya çalışın!**`);
            embed.setFields(
                { name: 'Kurpiyer', value: `${dealerHand[0]} | ❓` },
                { name: isSplit ? 'Bölünmüş El' : 'Oyuncu', value: `${playerHand.join(' | ')}` }
            );
            embed.setFooter({ text: `Toplam coin: ${user.coins}` });

            await interaction.update({ embeds: [embed], components: [row] });
        }

        async function endGame(result, isSplit = false) {
            collector.stop();

            let finalEmbed;

            if (result === 'win') {
                const winnings = betAmount * 2;
                user.coins += winnings;

                finalEmbed = new EmbedBuilder()
                    .setTitle('Kazandınız!')
                    .setColor('Green')
                    .addFields(
                        { name: 'Kurpiyer', value: `${dealerHand.join(' | ')}` },
                        { name: isSplit ? 'Bölünmüş El' : 'Oyuncu', value: `${playerHand.join(' | ')}` }
                    )
                    .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n**Tebrikler! ${winnings} coin kazandınız!**`)
                    .setFooter({ text: `Toplam coin: ${user.coins}` });
            } else if (result === 'push') {
                const winnings = betAmount;
                user.coins += winnings;

                finalEmbed = new EmbedBuilder()
                    .setTitle('Berabere')
                    .setColor('DarkGrey')
                    .addFields(
                        { name: 'Kurpiyer', value: `${dealerHand.join(' | ')}` },
                        { name: isSplit ? 'Bölünmüş El' : 'Oyuncu', value: `${playerHand.join(' | ')}` }
                    )
                    .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n**Tebrikler! ${winnings} coin kazandınız!**`)
                    .setFooter({ text: `Toplam coin: ${user.coins}` });
            } else {
                finalEmbed = new EmbedBuilder()
                    .setTitle('Kaybettiniz!')
                    .setColor('Red')
                    .addFields(
                        { name: 'Kurpiyer', value: `${dealerHand.join(' | ')}` },
                        { name: isSplit ? 'Bölünmüş El' : 'Oyuncu', value: `${playerHand.join(' | ')}` }
                    )
                    .setDescription(`**Bahis miktarınız:** ${betAmount} coin\n\n**Üzgünüz! ${betAmount} coin kaybettiniz.**`)
                    .setFooter({ text: `Toplam coin: ${user.coins}` });
            }

            await user.save();
            await interaction.editReply({ embeds: [finalEmbed], components: [] });

            if (isSplit) {
                playingSplitHand = false;
                splitHand = null;
            }
        }

        function createDeck() {
            const suits = ['♠', '♥', '♦', '♣'];
            const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const deck = [];

            for (const suit of suits) {
                for (const value of values) {
                    deck.push(`${value}${suit}`);
                }
            }

            return deck;
        }

        function shuffleDeck(deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            return deck;
        }

        function calculateHand(hand) {
            let sum = 0;
            let aceCount = 0;

            for (const card of hand) {
                const value = card.slice(0, -1);

                if (value === 'A') {
                    aceCount++;
                    sum += 11;
                } else if (['K', 'Q', 'J'].includes(value)) {
                    sum += 10;
                } else {
                    sum += parseInt(value);
                }
            }

            while (sum > 21 && aceCount > 0) {
                sum -= 10;
                aceCount--;
            }

            return sum;
        }

        function calculateResult(playerHand, dealerHand) {
            const playerSum = calculateHand(playerHand);
            const dealerSum = calculateHand(dealerHand);

            if (playerSum > 21) {
                return 'lose';
            } else if (dealerSum > 21 || playerSum > dealerSum) {
                return 'win';
            } else if (playerSum === dealerSum) {
                return 'push';
            } else {
                return 'lose';
            }
        }
    } catch (error) {
        console.error('blackjack oyunu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'blackjack oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }

    }
};
