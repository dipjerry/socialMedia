const express = require('express');
const authController = require('../controller/auth');
const router = express.Router();
const {check, body} = require('express-validator/check');
const User = require('../models/user');

router.put('/signup', [
  check('email').isEmail().withMessage('Please enter a valid email.')
      .custom((value, {req}) => {
        return User.findOne({email: value})
            .then((userDoc) => {
              if (userDoc) {
                return Promise.reject(
                    new Error('É-mail exist ,please select a different one.'),
                );
              }
            });
      }).normalizeEmail(),
  body('name').trim().not()
      .isEmpty().isLength({min: 5}),
  body('password').trim().isLength({min: 5}),
], authController.signUp);

router.post('/login', [
  check('email').isEmail()
      .withMessage('Please eneter a valid email.')
      .normalizeEmail(),
  body('password').trim().isLength({min: 5}),
], authController.login);

module.exports = router;
