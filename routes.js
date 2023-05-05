const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/musicposts/:_id/like', controller.likePost);
router.post('/musicposts/:_id/comment', controller.addComment);


module.exports = router;
