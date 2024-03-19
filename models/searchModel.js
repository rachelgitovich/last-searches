const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  searchPhrase: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Search = mongoose.model('Search', searchSchema);

searchSchema.index({ userId: 1, timestamp: -1 }); 
searchSchema.index({ timestamp: 1 }); 

module.exports = Search;
