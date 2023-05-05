const mongoose = require('mongoose');

const musicTrackSchema = new mongoose.Schema({
  artist: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  file: {
    type: String,
    required: true
  }
});

const MusicTrack = mongoose.model('MusicTrack', musicTrackSchema);

module.exports = MusicTrack;