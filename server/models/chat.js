import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema(
  {
    content: String,
    userId: { type: ObjectId, required: true, ref: 'User' },
    readBy: [{ type: ObjectId, ref: 'User' }],
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
    user1Id: { type: ObjectId, required: true, ref: 'User' },
    user2Id: { type: ObjectId, required: true, ref: 'User' },
  },
  { discriminatorKey: 'type', _id: false }
);

const groupChatSchema = new mongoose.Schema(
  {
    creatorId: { type: ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    photo: { type: String, default: 'default_profile.png' },
    members: [{ type: ObjectId, ref: 'User' }],
    admins: [{ type: ObjectId, ref: 'User' }],
    settings: {
      onlyAdmins: { type: Boolean, default: false },
      discoverable: { type: Boolean, default: true },
    },
  },
  { discriminatorKey: 'type', _id: false }
);

groupChatSchema.index({ name: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export const GroupChat = Chat.discriminator('group', groupChatSchema);

export const PrivateChat = Chat.discriminator('private', privateChatSchema);

export default Chat;
