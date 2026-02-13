const mongoose = require('mongoose');

// Mesaj ve kanal bilgilerini saklamak için bir şema tanımlayın
const GenderRolesSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    gentlemenRoleId: { type: String, required: true }, // Kedi rol ID'sini saklamak için alan
    ladiesRoleId: { type: String, required: true }  // Köpek rol ID'sini saklamak için alan
});

module.exports = mongoose.model('GenderRoles', GenderRolesSchema);
