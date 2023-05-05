const User = require('./user');
const { MusicPost } = require('./musicPost');

// Function to like a post
const likePost = async (req, res) => {
  try {
    console.log('Finding post');
    const postId = req.params._id;
    console.log('postId:', postId);
    const post = await MusicPost.findById(postId);
    console.log('Post found', post);
    if (post) {
      post.likes += 1;
      await post.save();
      res.status(200).json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
};

// Function to add a comment to a post
const addComment = async (req, res) => {
  try {
    console.log('Finding post');
    const postId = req.params._id;
    console.log('postId:', postId);
    const { userId, text } = req.body;
    console.log('userId:', userId); // Log the value of userId
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const post = await MusicPost.findById(postId); 
    console.log('Post found', post);
    if (post) {
      console.log('Comments before:', post.comments); // Log the comments before pushing
      post.comments.push({ user: userId, username: user.username, text });
      console.log('Comments after:', post.comments); // Log the comments after pushing
      await post.save();
      res.status(200).json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

module.exports = {
  likePost,
  addComment,
};
