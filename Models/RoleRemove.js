let {model, Schema} = require('mongoose');

let tempRoleSchema = new Schema({
    GuildId: String,
    UserId: String,
    RoleId: String,
    expiresAt: {type: Date},
    duration: Number,
});

module.exports = model('TempRoleRemove', tempRoleSchema);