const mongoose = require('mongoose');

const levelRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true }, // Sunucu ID'si
    levelRoles: { type: Map, of: String } // Seviye ve Rol eşlemesi (Seviye: Rol ID)
});

module.exports = mongoose.model('LevelRole', levelRoleSchema);
