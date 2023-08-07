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
    settings: {
      showOnline: {
        type: Boolean,
        default: true,
      },
      photoToNonFriends: {
        type: Boolean,
        default: true,
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

/*
Group Invites
Chats
Starred Messages
Friends

I won't get them unless with their populated data, I wouldn't care for anything else

However, for performance, I would also need to fetch them in pages.

the options are:
virtual getters (no parameters unless on the document)
static methods
query extensions
methods on instances
explicit populate

userSchema.virtual('populatedStarredMessages').get(async function () {
  const messages = await mongoose
    .model('Chat')
    .aggregate([
      {
        $match: {
          'messages._id': {
            $in: this.starredMessages,
          },
        },
      },
      { $unwind: '$messages' }, // Unwind the messages array
      {
        $lookup: {
          from: 'users',
          localField: 'messages.userId',
          foreignField: '_id',
          as: 'senderInfo',
        },
      },
      {
        $project: {
          messageId: '$messages._id',
          content: '$messages.content',
          chatId: '$_id',
          sender: {
            _id: { $arrayElemAt: ['$senderInfo._id', 0] },
            username: { $arrayElemAt: ['$senderInfo.username', 0] },
            profilePhoto: { $arrayElemAt: ['$senderInfo.profilePhoto', 0] },
          },
        },
      },
    ])
    .exec();

  return messages;
});

userSchema.virtual('populatedChats').get(async function () {
  const chats = await mongoose
    .model('Chat')
    .find({ _id: { $in: this.chats } })
    .select('name photo')
    .populate({
      path: 'messages',
      options: { sort: { date: -1 }, limit: 1 },
      select: 'content',
    })
    .exec();

  return chats;
});

userSchema.virtual('populatedFriends').get(async function () {
  const friends = await mongoose
    .model('User')
    .find({ _id: { $in: this.friends } })
    .select('username bio profilePhoto onlineStatus')
    .exec();

  return friends;
});
*/
export default mongoose.model('User', userSchema);
