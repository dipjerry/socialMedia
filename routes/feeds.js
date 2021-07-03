const express = require('express');
const feedController = require('../controller/feed');
const router = express.Router();
const {body} = require('express-validator');
const isAuth = require('../middleware/is-auth');

router.get('/posts', isAuth, feedController.getPosts);
router.post('/post', [
  body('title').trim().isLength({min: 5}),
  body('content').trim().isLength({min: 10}),
], isAuth, feedController.postPosts);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', [
  body('title').trim().isLength({min: 5}),
  body('content').trim().isLength({min: 5}),
], isAuth, feedController.updatePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);
router.get('/status', isAuth, feedController.getUserStatus);
router.patch(
    '/status',
    isAuth,
    [
      body('status')
          .trim()
          .not()
          .isEmpty(),
    ],
    feedController.updateUserStatus,
);


module.exports = router;
