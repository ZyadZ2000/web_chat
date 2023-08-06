import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema(
  {
    content: String,
    userId: { type: ObjectId, required: true, ref: 'User' },
    readBy: [{ type: ObjectId, ref: 'User' }],
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
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

// Add a virtual property to get paginated messages
chatSchema.virtual('paginatedMessages').get(function () {
  const pageSize = this.pageSize || 20; // Number of messages per page
  const currentPage = this.currentPage || 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return this.messages.slice(startIndex, endIndex);
});

export default mongoose.model('Chat', chatSchema);
