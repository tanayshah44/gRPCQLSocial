const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: String,
  name: String
});

module.exports = mongoose.model('User', UserSchema);
