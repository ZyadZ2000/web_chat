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
      lowercase: true,
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
    bio: String,
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    settings: {
      showOnline: {
        type: Boolean,
        default: true,
      },
      photoToNonFriends: {
        type: Boolean,
        default: false,
      },
    },
    groupInvites: [
      {
        chatId: {
          type: ObjectId,
          required: true,
          ref: 'Chat',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    chats: [
      {
        chatId: {
          type: ObjectId,
          required: true,
          ref: 'Chat',
        },
      },
    ],
    starredMessages: [
      {
        messageId: {
          type: ObjectId,
          required: true,
          ref: 'Chat.messages',
        },
      },
    ],
    friends: [
      {
        friendId: {
          type: ObjectId,
          required: true,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 }); // Index for efficient email lookups

export default mongoose.model('User', userSchema);
