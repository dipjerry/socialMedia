const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// signup module
exports.signUp = (req, res, next) =>{
  const error = validationResult(req);
  if (!error.isEmpty()) {
    error = new Error('Validation Failed');
    error.statusCode = 422;
    // error.data = error;
    throw error;
  }
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  console.log(name+','+ email+','+ password);
  bcrypt.hash(password, 12)
      .then((hashedPw)=>{
        const user = new User({
          email: email,
          name: name,
          password: hashedPw,
        });
        return user.save();
      })
      .then((result)=>{
        console.log('User is created successfully!!');
        res.status(201).json({
          message: 'User is created successfully!!',
          userId: result._id});
      })
      .catch((err)=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
};

// login module
exports.login = (req, res, next)=>{
  const error = validationResult(req);
  if (!error.isEmpty()) {
    error = new Error('validatiion Error');
    error.statusCode = 422;
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
      .then((user)=>{
        if (!user) {
          const error = new Error('No email found wityh this account..');
          error.statusCode = 401;
          throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
      })
      .then((isEqual)=>{
        if (!isEqual) {
          const error = new Error('Wronng Password');
          error.statusCode = 401;
          throw error;
        }
        const token = jwt.sign({
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        }, 'SuperToken', {expiresIn: '1h'});
        res.status(200).json({token: token, userId: loadedUser._id.toString(),
        });
      })
      .catch((err)=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
};

