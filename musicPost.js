const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./user');

const musicPostSchema = new mongoose.Schema({
  username: { type: String, required: true, default: 'Unknown' },
  song: { type: String, required: true, default: 'Unknown' },
  caption: { type: String, required: true, default: 'No caption' },
  url: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});


const MusicPost = mongoose.model('MusicPost', musicPostSchema);
console.log('MusicPost model:', MusicPost);

const saveMusicPost = async (songName, artistName, userId, caption) => {
  try {
    // Retrieve the user object from the database using the userId
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with id ${userId} not found`);
      return;
    }

    // Get the song info from Last.fm
    const response = await axios.get(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=2cca08af90c4ebcfd0c720e520019dd0&artist=${artistName}&track=${songName}&format=json`);
    const trackInfo = response.data.track;
    const url = trackInfo.url;

    // Create a new MusicPost object with the required fields
    const newMusicPost = new MusicPost({
      username: user.username,
      song: songName,
      caption: caption,
      url: url,
      user: userId
    });

    // Save the new MusicPost object to the database
    await newMusicPost.save();
    console.log('Music post saved successfully');
  } catch (error) {
    console.error('Error saving music post to database:', error);
  }
};

module.exports = {
  MusicPost,
  saveMusicPost
};
