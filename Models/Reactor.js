const { Guild, StringSelectMenuInteraction } = require('discord.js');
const {model, Schema} = require('mongoose');

let ReactorSchema = new Schema({
    Guild: String,
    Channel: String,
    Emoji: String,
    Emoji2: String
});

module.exports = model('Reactor', ReactorSchema);