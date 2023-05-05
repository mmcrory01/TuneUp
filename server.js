const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('./user');
const app = express();
const multer = require('multer');
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });
const { MusicPost, saveMusicPost } = require('./musicPost');
const upload = require('./upload');
const axios = require('axios');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const port = 3000;
const musicPostRoutes = require('./routes');

app.use(musicPostRoutes);


mongoose.connect('mongodb://127.0.0.1:27017/Users', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connection successful'))
  .catch((err) => console.error('Database connection error', err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('Project'));
app.set('view engine', 'ejs');
app.set('views', 'views');


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/signup.html', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.get('/home', async (req, res) => {
  const musicPosts = await MusicPost.find().populate('user').sort({ createdAt: -1 });
  res.render('home', { musicPosts: musicPosts });
});



app.post('/signup', (req, res) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        res.json({ error: 'username_taken' });
        return;
      }

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
      });

      newUser.save()
        .then((user) => {
          res.cookie('loggedIn', 'true');
          res.redirect('/home');
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error occurred');
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error occurred');
    });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username: username })
    .then((user) => {
      if (!user) {
        res.send(`<script>alert('Invalid username or password'); window.location.href = '/login.html';</script>`);
        return;
      }

      if (user.password !== password) {
        res.send(`<script>alert('Invalid username or password'); window.location.href = '/login.html';</script>`);
        return;
      }

      // if valid, set a cookie to mark the user as logged in
      res.cookie('loggedIn', 'true');
      res.cookie('userId', user._id); // add userId to cookie
      // redirect to the home page
      res.redirect('/home'); // Change to /home
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error occurred');
    });
});

app.post('/post', uploadMiddleware.any(), async (req, res) => {
  const { caption, 'selected-song-input': selectedSong } = req.body;
  const userId = req.cookies.userId;

  console.log('selectedSong:', selectedSong);

  // Validate the selected song
  if (!selectedSong) {
    console.error('No song selecteddd');
    res.status(400).send('No song selectedd');
    return;
  }

  const regex = /https:\/\/www\.last\.fm\/music\/(.+?)\/(.+?)\/(.+)$/i;
  const match = selectedSong.match(regex);

  if (!match) {
    console.error('Invalid song URL format');
    res.status(400).send('Invalid song URL format');
    return;
  }

  const artistName = match[1];
  const songName = match[3];

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error(`Invalid userId: ${userId}`);
    res.status(400).send('Invalid userId');
    return;
  }

  try {
    // Fetch the user data from the database
    const user = await User.findById(userId);

    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      res.status(400).send('User not found');
      return;
    }

    // Call the saveMusicPost function to save the music post to the database
    await saveMusicPost(songName, artistName, user._id, caption);

    // Send a success response to the client
    res.redirect('/home');
  } catch (error) {
    console.error('Error occurred while saving music post:', error);
    res.status(500).send('Error occurred while saving music post');
  }
  console.log(req.body);
});

app.post('/musicPost', async (req, res) => {
  const songName = req.body.song;
  const artistName = req.body.artist;
  const userId = req.body.user._id; // Make sure you're sending the user ID from the frontend
  const caption = req.body.caption;

  try {
    await saveMusicPost(songName, artistName, userId, caption);
    res.send('Music post saved successfully');
  } catch (error) {
    console.error('Error saving music post to database:', error);
    res.status(500).send('Error saving music post to database');
  }
});




app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
