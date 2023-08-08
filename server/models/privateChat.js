import mongoose from 'mongoose';
import { messageSchema } from './chat';

const ObjectId = mongoose.Schema.Types.ObjectId;

const privateChatSchema = new mongoose.Schema(
  {
    user1: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    user2: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Indexes
privateChatSchema.index({ user1: 1 });
privateChatSchema.index({ user2: 1 });

export default mongoose.model('PrivateChat', privateChatSchema);
