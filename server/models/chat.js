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
    members: [{ type: ObjectId, ref: 'User' }],
    messages: [messageSchema],
  },
  { timestamps: true }
);

const groupChatSchema = new mongoose.Schema(
  {
    creatorId: { type: ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    photo: { type: String, default: 'default_profile.png' },

    admins: [{ type: ObjectId, ref: 'User' }],
    settings: {
      onlyAdmins: { type: Boolean, default: false },
    },
  },
  { discriminatorKey: 'type', _id: false }
);

groupChatSchema.index({ name: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export const GroupChat = Chat.discriminator('group', groupChatSchema);

export default Chat;
