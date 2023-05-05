const express = require('express');
const router = express.Router();
const controller = require('./controller'); 

router.post('/musicposts/:id/like', controller.likePost);
router.post('/musicposts/:id/comment', controller.addComment);

module.exports = router;
