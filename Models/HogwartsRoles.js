const mongoose = require('mongoose');

// Hogwarts mesaj ve kanal bilgilerini saklamak için bir şema tanımlayın
const hogwartsRolesSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    gryffindorRoleId: { type: String, required: true }, // Gryffindor rol ID'si
    hufflepuffRoleId: { type: String, required: true }, // Hufflepuff rol ID'si
    ravenclawRoleId: { type: String, required: true },  // Ravenclaw rol ID'si
    slytherinRoleId: { type: String, required: true }   // Slytherin rol ID'si
});

module.exports = mongoose.model('HogwartsRoles', hogwartsRolesSchema);
