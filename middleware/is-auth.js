const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    // const error = new Error('not authenticated');
    // error.statusCode = 401;
    // throw error;
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'SuperToken');
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    // const error = new Error('Not Authenticated');
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
