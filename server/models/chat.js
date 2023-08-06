import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema(
  {
    content: String,
    userId: { type: ObjectId, required: true, ref: 'User' },
    readBy: [{ type: ObjectId, ref: 'User' }],
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    creatorId: { type: ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    photo: String,
    admins: [{ type: ObjectId, ref: 'User' }],
    members: [{ type: ObjectId, required: true, ref: 'User' }],
    joinRequests: [
      {
        userId: { type: ObjectId, required: true, ref: 'User' },
        date: { type: Date, default: Date.now },
      },
    ],
    settings: {
      onlyAdmins: { type: Boolean, default: false },
      discoverable: { type: Boolean, default: true },
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ name: 1 });

export default mongoose.model('Chat', chatSchema);
