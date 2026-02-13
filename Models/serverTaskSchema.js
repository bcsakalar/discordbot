let {model, Schema} = require('mongoose');

let serverTaskSchema = new Schema({
    GuildId: String,
    Task: Array,
}, {versionKey: false});

module.exports = model('serverTaskSchema', serverTaskSchema, 'serverTaskSchema');