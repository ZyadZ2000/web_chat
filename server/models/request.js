import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['privateRequest', 'friendRequest', 'groupRequest', 'joinRequest'],
    },
  },
  {
    discriminatorKey: 'type',
    timestamps: true,
  }
);

const privateRequestSchema = new mongoose.Schema({
  sender: { type: ObjectId, required: true, ref: 'User' },
  receiver: { type: ObjectId, required: true, ref: 'User' },
});

const groupChatRequestSchema = new mongoose.Schema({
  chat: { type: ObjectId, required: true, ref: 'Chat' },
  receiver: { type: ObjectId, required: true, ref: 'User' },
});

const joinGroupRequestSchema = new mongoose.Schema({
  sender: { type: ObjectId, required: true, ref: 'User' },
  chat: { type: ObjectId, required: true, ref: 'Chat' },
});

privateRequestSchema.index({ sender: 1, receiver: 1 });
groupChatRequestSchema.index({ chat: 1, receiver: 1 });
joinGroupRequestSchema.index({ sender: 1, chat: 1 });

const Request = mongoose.model('Request', requestSchema);

export const PrivateRequest = Request.discriminator(
  'privateRequest',
  privateRequestSchema
);
export const FriendRequest = Request.discriminator(
  'friendRequest',
  privateRequestSchema
);
export const GroupChatRequest = Request.discriminator(
  'groupRequest',
  groupChatRequestSchema
);
export const JoinGroupRequest = Request.discriminator(
  'joinRequest',
  joinGroupRequestSchema
);

export default Request;
