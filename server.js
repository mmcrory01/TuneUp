const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('./user');
const app = express();
const multer = require('multer');
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/Users', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connection successful'))
  .catch((err) => console.error('Database connection error', err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('Project'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/signup.html', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.get('/home.html', (req, res) => {
  res.sendFile(__dirname + '/home.html');
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
          res.redirect('/home.html');
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
      // redirect to the home page
      res.redirect('/home.html');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error occurred');
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
