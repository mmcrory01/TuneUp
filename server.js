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
const querystring = require('querystring');
const port = 3000;
const musicPostRoutes = require('./routes');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

app.use(musicPostRoutes);


mongoose.connect('mongodb://127.0.0.1:27017/Users', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connection successful'))
  .catch((err) => console.error('Database connection error', err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('Project'));
app.set('view engine', 'ejs');
app.set('views', 'views');

const personalRefreshToken = 'AQB2RECrbx8LAReRXlKmhTm2c4PL26LYfRFdrSEou6aJoNbWNHsoI-QSPL8XYSH_LtNRLE9VjK3yXVLluXV-5HXTCBUJOCpBjdAzHObrX_FHOk2LzogzxVnJRvwKLGdVXpU';



const spotifyApi = new SpotifyWebApi({
  clientId: '839279246b6446b8a60c7e4641ff8d8a',
  clientSecret: '57ddfabb625c44f396e73045dfd632be',
  redirectUri: 'http://localhost:3000/callback',
  refreshToken: personalRefreshToken
});


refreshAccessToken();


async function refreshAccessToken() {
  try {
    const data = await new Promise((resolve, reject) => {
      spotifyApi.refreshAccessToken((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
    const access_token = data.body['access_token'];
    spotifyApi.setAccessToken(access_token);
    console.log('Access token refreshed');
  } catch (err) {
    console.error('Error refreshing access token:', err);
  }
}

  
  
  setInterval(refreshAccessToken, 50 * 60 * 1000); // Refresh the token every 50 minutes


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
  res.render('home', { musicPosts: musicPosts, accessToken: spotifyApi.getAccessToken() });
});

function requireLogin(req, res, next) {
  if (!req.cookies.userId) {
    res.redirect('/login.html');
  } else {
    next();
  }
}


// Profile page - displays music posts by the user
app.get('/profile', requireLogin, async (req, res) => {
  const userId = req.cookies.userId;
  // Find user by ID and populate their music posts
  const user = await User.findById(userId).lean().populate({ path: 'musicPosts', options: { sort: { createdAt: -1 } } }).exec();
  res.render('profile', { user: user });
  console.log(userId);
  console.log(user);
});

// Middleware function to require login
function requireLogin(req, res, next) {
  if (!req.cookies.userId) {
    res.redirect('/login.html');
  } else {
    next();
  }
}


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
  
  // Validate the selected song
  if (!selectedSong) {
    console.error('No song selected');
    res.status(400).send('No song selected');
    return;
  }
  
  try {
    // Extract the track ID from the selectedSong URL
    const trackIdRegex = /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const match = selectedSong.match(trackIdRegex);
    if (!match || !match[1]) {
      console.error('Invalid Spotify URL');
      res.status(400).send('Invalid Spotify URL');
      return;
    }
    const trackId = match[1];

    // Get the song details from Spotify using the track ID
    const { body: { name: songName, artists: [{ name: artistName }] } } = await spotifyApi.getTrack(trackId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`Invalid userId: ${userId}`);
      res.status(400).send('Invalid userId');
      return;
    }
  
    // Fetch the user data from the database
    const user = await User.findById(userId);
  
    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      res.status(400).send('User not found');
      return;
    }
  
    const accessToken = spotifyApi.getAccessToken();
    // Call the saveMusicPost function to save the music post to the database
    await saveMusicPost(songName, artistName, user._id, caption, accessToken);
    

    // Send a success response to the client
    res.redirect('/home');
  } catch (error) {
    console.error('Error occurred while saving music post:', error);
    res.status(500).send('Error occurred while saving music post');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
