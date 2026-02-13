const mongoose = require('mongoose');

// Mesaj ve kanal bilgilerini saklamak için bir şema tanımlayın
const AnimalRolesSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    catRoleId: { type: String, required: true }, // Kedi rol ID'sini saklamak için alan
    dogRoleId: { type: String, required: true }  // Köpek rol ID'sini saklamak için alan
});

module.exports = mongoose.model('AnimalRoles', AnimalRolesSchema);
