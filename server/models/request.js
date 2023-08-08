import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['private', 'friend', 'group', 'join'],
    },
  },
  {
    timestamps: true,
  }
);

const privateRequestSchema = new mongoose.Schema(
  {
    senderId: { type: ObjectId, required: true, ref: 'User' },
    receiverId: { type: ObjectId, required: true, ref: 'User' },
  },
  { discriminatorKey: 'type', _id: false }
);

const groupChatRequestSchema = new mongoose.Schema(
  {
    chatId: { type: ObjectId, required: true, ref: 'Chat' },
    receiverId: { type: ObjectId, required: true, ref: 'User' },
  },
  { discriminatorKey: 'type', _id: false }
);

const joinGroupRequestSchema = new mongoose.Schema(
  {
    senderId: { type: ObjectId, required: true, ref: 'User' },
    chatId: { type: ObjectId, required: true, ref: 'Chat' },
  },
  { discriminatorKey: 'type', _id: false }
);

privateRequestSchema.index({ senderId: 1, receiverId: 1 });
groupChatRequestSchema.index({ chatId: 1, receiverId: 1 });
joinGroupRequestSchema.index({ senderId: 1, chatId: 1 });

const Request = mongoose.model('Request', requestSchema);

export const PrivateRequest = Request.discriminator(
  'private',
  privateRequestSchema
);
export const FriendRequest = Request.discriminator(
  'friend',
  privateRequestSchema
);
export const GroupChatRequest = Request.discriminator(
  'group',
  groupChatRequestSchema
);
export const JoinGroupRequest = Request.discriminator(
  'join',
  joinGroupRequestSchema
);

export default Request;
