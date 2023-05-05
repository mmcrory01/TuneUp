// Function to like a post
const likePost = async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await MusicPost.findById(postId);
      if (post) {
        post.likes += 1;
        await post.save();
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error liking post' });
    }
  };
  
  // Function to add a comment to a post
  const addComment = async (req, res) => {
    try {
      const postId = req.params.id;
      const { userId, text } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const post = await MusicPost.findById(postId);
      if (post) {
        post.comments.push({ user: userId, username: user.username, text });
        await post.save();
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error adding comment' });
    }
  };
  
  // Export the new functions
  module.exports = {
    
    likePost,
    addComment
  };
  