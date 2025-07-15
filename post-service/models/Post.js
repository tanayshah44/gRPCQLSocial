// post-service/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  id: String,
  title: String,
  content: String
});

module.exports = mongoose.model('Post', postSchema);
