const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const Score = require('../../Models/Score');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yılan')
        .setDescription('Yılan oyunu'),
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

            // Yılan oyunu kodunuz burada devam ediyor...

            const embed = new EmbedBuilder()
                .setTitle('Yılan Oyunu')
                .setDescription('Yılan oyununu oynarken iyi eğlenceler!\n⬆️')
                .setColor('#5865F2');

            const buttonsTopRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('1')
                        .setDisabled(true)
                        .setLabel('😥')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('up')
                        .setLabel('⬆️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('2')
                        .setDisabled(true)
                        .setLabel('😥')
                        .setStyle(ButtonStyle.Primary)
                );

            const buttonsBottomRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('left')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('down')
                        .setLabel('⬇️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('right')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('Durdur')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [buttonsTopRow, buttonsBottomRow] });

            // Continue with the game logic...
            let direction = 'right';
            let snakePosition = { x: 5, y: 5 };
            let snakeBody = [snakePosition];
            let gameBoard = Array(10).fill().map(() => Array(10).fill('⬛'));
            let foodPosition = generateFoodPosition();
            let score = 0;
            let isMoving = false; // Yeni bir kilit durumu

            function generateFoodPosition() {
                let position;
                do {
                    position = { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) };
                } while (snakeBody.some(segment => segment.x === position.x && segment.y === position.y));
                return position;
            }

            function updateBoard() {
                const newHead = { x: snakePosition.x, y: snakePosition.y };
                if (direction === 'up') newHead.y--;
                if (direction === 'down') newHead.y++;
                if (direction === 'left') newHead.x--;
                if (direction === 'right') newHead.x++;

                if (newHead.y < 0 || newHead.y >= gameBoard.length || newHead.x < 0 || newHead.x >= gameBoard[0].length) {
                    clearInterval(moveInterval);
                    gameOver(score);
                    return;
                }

                if (snakeBody.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                    clearInterval(moveInterval);
                    gameOver(score);
                    return;
                }

                snakeBody.unshift(newHead);
                snakePosition = newHead;

                if (newHead.x === foodPosition.x && newHead.y === foodPosition.y) {
                    foodPosition = generateFoodPosition();
                    score++;
                } else {
                    snakeBody.pop();
                }

                gameBoard = gameBoard.map(row => row.map(cell => (cell === '🟢' || cell === '🟩') ? '⬛' : cell));
                snakeBody.forEach((segment, index) => {
                    gameBoard[segment.y][segment.x] = index === 0 ? '🟢' : '🟩';
                });
                gameBoard[foodPosition.y][foodPosition.x] = '🍎';

                const newEmbed = new EmbedBuilder()
                    .setTitle(`Yılan Oyunu - Skor: ${score}`)
                    .setDescription(gameBoard.map(row => row.join(' ')).join('\n'))
                    .setColor('#5865F2');

                interaction.editReply({ embeds: [newEmbed] });
            }

            const moveInterval = setInterval(() => {
                isMoving = true; // Yılan hareket ediyor
                updateBoard();
                isMoving = false; // Yılanın hareketi tamamlandı
            }, 2000);

            const filter = i => i.isButton() && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async buttonInteraction => {
                try {
                    if (buttonInteraction.customId === 'up') await handleMovement('up');
                    if (buttonInteraction.customId === 'down') await handleMovement('down');
                    if (buttonInteraction.customId === 'left') await handleMovement('left');
                    if (buttonInteraction.customId === 'right') await handleMovement('right');
                    if (buttonInteraction.customId === 'stop') {
                        clearInterval(moveInterval);
                        gameOver(score);
                        collector.stop(); // Oyun bitince koleksiyonu durdur
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                    await buttonInteraction.reply({
                        content: 'Bir hata oluştu, lütfen tekrar deneyin.',
                        ephemeral: true,
                    });
                }

                await buttonInteraction.deferUpdate();
            });

            collector.on('end', () => {
                clearInterval(moveInterval); // Koleksiyon sona erdiğinde hareketi durdur
            });

            async function handleMovement(newDirection) {
                if (isMoving) return; // Eğer yılan hareket ediyorsa başka bir hareket kabul edilmez
                isMoving = true;

                // Yön değişikliği için geçerli kontroller
                if ((newDirection === 'up' && direction !== 'down') ||
                    (newDirection === 'down' && direction !== 'up') ||
                    (newDirection === 'left' && direction !== 'right') ||
                    (newDirection === 'right' && direction !== 'left')) {
                    direction = newDirection;
                }

                isMoving = false; // Hareket tamamlandıktan sonra kilidi kaldır
            }

            const gameOver = async (score) => {
                try {
                    const newScore = new Score({
                        userId: interaction.user.id,
                        username: interaction.user.username,
                        score: score,
                    });

                    await newScore.save();

                    const topScores = await Score.find().sort({ score: -1 }).limit(3);

                    const scoreBoard = topScores.map((score, index) =>
                        `${index + 1}. ${score.username} - ${score.score} puan`
                    ).join('\n');

                    const topScoreIds = topScores.map(score => score._id);
                    await Score.deleteMany({ _id: { $nin: topScoreIds } });

                    const gameOverEmbed = new EmbedBuilder()
                        .setTitle('Oyun Bitti')
                        .setDescription(`${interaction.user.username}, oyununuz sona erdi!`)
                        .setColor('#FF0000')
                        .addFields(
                            { name: 'Puan', value: `${score}`, inline: true },
                            { name: 'Skor Tablosu', value: scoreBoard },
                        )
                        .setThumbnail(interaction.user.displayAvatarURL());

                    interaction.followUp({ embeds: [gameOverEmbed] });
                } catch (error) {
                    console.error('Game over error:', error);
                    await interaction.followUp({
                        content: 'Puan kaydedilirken bir hata oluştu, lütfen daha sonra tekrar deneyin.',
                        ephemeral: true,
                    });
                }
            };
        } catch (error) {
            console.error('Yılan oyunu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'Yılan oyunu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
};
