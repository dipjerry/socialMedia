const express = require('express');
const config = require('./config');
// parsers

const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const mongoose = require('mongoose');
// database
const MONGODB_URI = 'mongodb+srv://' + config.mongoUser + ':' + config.mongoPass + '@cluster0.eolis.mongodb.net/socio';

// host and port
const hostname = '127.0.0.1';
const port = 8080;
const app = express();
const feedRoute = require('./routes/feeds');
const authRoute = require('./routes/auth');

// disk object
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images/');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') +
    '-' + file.originalname.replace(/\s/g, '_'));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(bodyParser.json());

app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image'),
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Route and paths
app.use('/feed', feedRoute);
app.use('/auth', authRoute);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// error handler
app.use((error, req, res, next)=>{
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({message: message, data: data});
});

// db connection
mongoose.set('useUnifiedTopology', true);
// mongoose.connect(MONGODB_URI)
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
    .then((result)=>{
      app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
      });
    })
    .catch((err)=>{
      console.log(err);
    });
