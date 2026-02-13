const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    game_channel: { type: String },
    fun_channel: { type: String },
    cekilis_channel: { type: String },
    info_channel: { type: String },
    levels_channel: { type: String },
    moderation_channel: { type: String },
    tools_channel: { type: String },
    poll_channel: { type: String },
    reactor_channel: { type: String },
    ticket_channel: { type: String },
    kick_notification_channel: { type: String },
    insta_notification_channel: { type: String },
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);
