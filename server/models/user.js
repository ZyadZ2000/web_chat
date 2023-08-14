import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: 'default_profile.png',
    },
    bio: { type: String, default: '' },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    chats: [
      {
        type: ObjectId,
        ref: 'Chat',
      },
    ],
    friends: [
      {
        type: ObjectId,
        ref: 'User',
      },
    ],
    token: {
      type: String,
      default: null,
    },
    tokenExpiration: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);
