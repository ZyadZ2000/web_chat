import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema(
  {
    content: String,
    senderId: { type: ObjectId, required: true, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const privateChatSchema = new mongoose.Schema(
  {
    users: [{ type: ObjectId, ref: 'User', required: true }],
  },
  { discriminatorKey: 'type', _id: false }
);

const groupChatSchema = new mongoose.Schema(
  {
    creatorId: { type: ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    photo: { type: String, default: 'default_profile.png' },
    members: [{ type: ObjectId, ref: 'User' }], //The creator is the first member
    admins: [{ type: ObjectId, ref: 'User' }],
  },
  { discriminatorKey: 'type', _id: false }
);

groupChatSchema.index({ name: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export const PrivateChat = Chat.discriminator('private', privateChatSchema);

export const GroupChat = Chat.discriminator('group', groupChatSchema);

export default Chat;
