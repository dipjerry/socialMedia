const {validationResult} = require('express-validator/check');
const Post = require('../models/post');
const User = require('../models/user');
// const fs = require('fs');
// const path = require('path');
const fileHelper = require('../util/file');
const IO = require('../socket');
// get all post
// method 1 : then catch

// exports.getPosts = (req, res, next) => {
//   const currentPage = +req.query.page || 1;
//   const perPage = 2;
//   let totalItems;
//   Post.find()
//       .countDocuments()
//       .then((count)=>{
//         totalItems = count;
//         return Post.find().skip((currentPage-1)*perPage)
//             .limit(perPage);
//       })
//       .then((posts)=>{
//         res.status(200).json({
//           posts: posts,
//           message: 'Posts Fetched Successfully',
//           totalItems: totalItems,
//         });
//       })
//       .catch((err)=>{
//         if (!err.statusCode) {
//           err.statusCode = 500;
//         }
//         next(err);
//       });
// };

// async await method
exports.getPosts = async (req, res, next) => {
  const currentPage = +req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().populate('creator')
        .sort({createdAt: -1})
        .skip((currentPage-1)*perPage)
        .limit(perPage);
    res.status(200).json({
      posts: posts,
      message: 'Posts Fetched Successfully',
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get single post
// then catch methodf
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
      .then((post)=>{
        if (!post) {
          const error = new Error('Could not find post');
          error.statusCode = 404;
          throw error;
        }
        res.status(200).json({
          post: post,
          message: 'Post fetched Success!!',
        });
      })
      .catch((err)=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
};

// upload a post
exports.postPosts = async (req, res, next) => {
  const image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed , entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!image) {
    const error = new Error('No image provided!!!');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = image.path.replace(/\\/g, '/');
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    IO.getIo().emit('posts', {
      action: 'create',
      post: {
        ...post._doc,
        creator: {
          _id: req.userId,
          name: user.name,
        }},
    });
    res.status(201).json({
      message: 'post created succesfull!!!!',
      post: post,
      creator: {
        _id: user._id,
        name: user.name,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  };
};

// update a post
exports.updatePost= async (req, res, next)=>{
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  console.log('imageUrl');
  console.log(imageUrl);
  if (req.file) {
    imageUrl = req.file.path.replace(/\\/g, '/');
  }
  if (!imageUrl) {
    const error = new Error('No file Selected');
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId).populate('creator');

    if (!post) {
      const error = new Error('Could not Find the post to update');
      error.statusCode = 404;
      throw error;
    }
    console.log('post.creator');
    console.log(post.creator);
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not Auithorization');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      console.log('image url');
      console.log(post.imageUrl.replace(/\//g, '\\'));
      fileHelper.clearFile(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();
    IO.getIo().emit('posts', {action: 'update', post: result});
    res.status(200)
        .json({message: 'post updation successfull!!', post: result});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  };
};

// delete module
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Auithorization');
      error.statusCode = 403;
      throw error;
    }
    fileHelper.clearFile(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    console.log('user');
    console.log(user);
    user.posts.pull(postId);
    await user.save();
    console.log('post destoyed');
    IO.getIo().emit('posts', {action: 'delete', post: postId});
    res.status(200).json({message: 'successfully deleted post!'});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode=500;
    }
    next(err);
  };
};

// user status module
exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({status: user.status});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// user status update module
exports.updateUserStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  console.log('newStatus');
  console.log(newStatus);
  console.log(req.body.status);
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({message: 'User updated.'});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

