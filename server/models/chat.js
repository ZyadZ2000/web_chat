import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema(
  {
    content: String,
    sender: { type: ObjectId, required: true, ref: 'User' },
    type: {
      type: String,
      enum: ['text', 'media'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['privateChat', 'groupChat'],
      required: true,
    },
    messages: [messageSchema],
  },
  { discriminatorKey: 'type', timestamps: true }
);

const privateChatSchema = new mongoose.Schema({
  users: [{ type: ObjectId, ref: 'User', required: true }],
});

const groupChatSchema = new mongoose.Schema({
  creator: { type: ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  photo: { type: String, default: 'default_profile.png' },
  members: { type: [{ type: ObjectId, ref: 'User' }], required: true },
  admins: [{ type: ObjectId, ref: 'User' }],
});

groupChatSchema.index({ name: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export const PrivateChat = Chat.discriminator('privateChat', privateChatSchema);

export const GroupChat = Chat.discriminator('groupChat', groupChatSchema);

export default Chat;
