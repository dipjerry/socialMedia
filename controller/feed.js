const {validationResult} = require('express-validator/check');
const Post = require('../models/post');
const User = require('../models/user');
// const fs = require('fs');
// const path = require('path');
const fileHelper = require('../util/file');

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
exports.postPosts = (req, res, next) => {
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
  let creator;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  post.save()
      .then(
          (result)=>{
            return User.findById(req.userId);
          })
      .then((user)=>{
        creator = user;
        user.posts.push(post);
        return user.save();
      })
      .then((result)=>{
        res.status(201).json({
          message: 'post created succesfull!!!!',
          post: post,
          creator: {
            _id: creator._id,
            name: creator.name,
          },
        });
      })
      .catch((err)=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
};

// update a post
exports.updatePost=(req, res, next)=>{
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  console.log('imageUrl');
  console.log(imageUrl);
  if (req.file) {
    imageUrl = req.file.path.replace(/\\/g, '/');
  }
  // if (!imageUrl) {
  //   const error = new Error('No file Selected');
  //   error.statusCode = 422;
  //   throw error;
  // }
  Post.findById(postId)
      .then((post)=>{
        if (!post) {
          const error = new Error('Could not Find the post to update');
          error.statusCode = 404;
          throw error;
        }
        if (post.creator.toString() !== req.userId) {
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
        return post.save();
      })
      .then((result)=>{
        res.status(200)
            .json({message: 'post updation successfull!!', post: result});
      })
      .catch((err)=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
};

// delete module
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
      .then((post) => {
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
        return Post.findByIdAndRemove(postId);
      })
      .then((findPosts) => {
        return User.findby(postId);
      })
      .then((user) => {
        user.posts.pull(postId);
        return user.save();
      })
      .then((result) => {
        console.log('post destoyed');
        res.status(200).json({message: 'successfully deleted post!'});
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode=500;
        }
        next(err);
      });
};
