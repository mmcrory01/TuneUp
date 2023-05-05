require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./user');
const axios = require('axios');


const musicPostSchema = new mongoose.Schema({
  username: { type: String, required: true, default: 'Unknown' },
  song: { type: String, required: true, default: 'Unknown' },
  artist: { type: String, required: true, default: 'Unknown' },
  caption: { type: String, required: true, default: 'No caption' },
  url: { type: String, required: true },
  albumCover: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      text: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ]
});

const MusicPost = mongoose.model('MusicPost', musicPostSchema);
console.log('MusicPost model:', MusicPost);

const saveMusicPost = async (songName, artistName, userId, caption,  accessToken) => {
  try {
    // Retrieve the user object from the database using the userId
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with id ${userId} not found`);
      return;
    }

    // Get the song info from Spotify
    const response = await axios.get(`https://api.spotify.com/v1/search?q=track:${songName}%20artist:${artistName}&type=track&limit=1`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });

    // Extract the relevant data from the response
    const trackInfo = response.data.tracks.items[0];
    const url = trackInfo.external_urls.spotify;
    const imageUrl = trackInfo.album.images[0].url;

    // Create a new MusicPost object with the required fields
    const newMusicPost = new MusicPost({
      username: user.username,
      song: songName,
      artist: artistName,
      albumCover: imageUrl,
      caption: caption,
      url: url,
      user: userId
    });
    console.log("Before saving:", newMusicPost);

    // Save the new MusicPost object to the database
    await newMusicPost.save();

    console.log("After saving:", newMusicPost);

    console.log("User before updating musicPosts:", user);

    // Add the new music post to the user's musicPosts array
    user.musicPosts.push(newMusicPost._id);

    // Save the updated user object to the database
    await user.save();

    console.log("User after updating musicPosts:", user);
    console.log('Music post saved successfully');
  } catch (error) {
    console.error('Error saving music post to database:', error);
  }
};


module.exports = {
  MusicPost,
  saveMusicPost
};