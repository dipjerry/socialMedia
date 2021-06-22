const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
      name: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: 'I am a new User',
      },
      posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
      }],
    },
    {
      timestamps: true,
    },
);

module.exports = mongoose.model('Users', userSchema);
