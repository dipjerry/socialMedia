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
// graphQL HTTP
const {graphqlHTTP} = require('express-graphql');
// graphQL Schema
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolver');
const auth = require('./middleware/is-auth');
const app = express();

const fileHelper = require('./util/file');
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
  res.setHeader(
      'Access-Control-Allow-Methods',
      'PUT, GET, POST, DELETE, OPTIONS , PATCH');
  res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With,Content-Type, Authorization',
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));


// token authorizatio
app.use(auth);

// image handler
app.put('/post-image', (req, res, next)=>{
  console.log('pass1');
  if (!req.isAuth) {
    throw new Error('Not Authenticated');
  }
  if (!req.file) {
    return res.status(200).json({message: 'No file provided!!!'});
  }
  if (req.body.oldPath) {
    fileHelper.clearFile(req.body.oldPath);
  }
  console.log('2');
  console.log(req.file);
  return res
      .status(201)
      .json({message: 'File stored', filePath: req.file.path});
});


app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err) {
    if (!err.originalError) {
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'An error occurred';
    const code = err.originalError.code || 500;
    console.log('err');
    console.log(err);
    console.log();
    return {message: message, status: code, data: data};
  },
}),
);

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
      app.listen(port);
      // const io = require('./socket').init(server);
      // console.log(`Server starting at http://${hostname}:${port}/`);
      // io.on('connection', (socket)=>{
      //   console.log(`Server running at http://${hostname}:${port}/`);
      // });
    })
    .then(()=>{
      console.log(`🚀Server starting at http://${hostname}:${port}/`);
    })
    .catch((err)=>{
      console.log(err);
    });
