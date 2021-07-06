const fs = require('fs');
const path = require('path');

// const deleteFile = (filePath) => {
//   filePath = path.join(__dirname, '..', filePath);
//   console.log('filePAth');
//   console.log('__dirname');
//   console.log(__dirname);
//   console.log(filePath);
//   fs.unlink(filePath, (err) => {
//     if (err) {
//       throw (err);
//     }
//   });
// };


const clearFile = (filePath) =>{
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err)=>console.log(err));
};

exports.clearFile = clearFile;
