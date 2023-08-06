import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const privateInviteSchema = new mongoose.Schema(
  {
    senderId: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    receiverId: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: ['friend', 'chat'], // a friend request or a private chat request
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
privateInviteSchema.index({ senderId: 1 });
privateInviteSchema.index({ receiverId: 1 });

export default mongoose.model('PrivateInvite', privateInviteSchema);
