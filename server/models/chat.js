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
/*
// Virtual Methods
chatSchema.virtual('paginatedMessages').get(async function () {
  const pageSize = this.pageSize || 20; // Number of messages per page
  const currentPage = this.currentPage || 1;

  try {
    const chat = await mongoose.model('Chat').aggregate([
      { $match: { _id: this._id } },
      {
        $project: {
          messages: {
            $slice: ['$messages', (currentPage - 1) * pageSize, pageSize],
          },
        },
      },
    ]);

    return chat[0]?.messages || [];
  } catch (error) {
    console.error(error);
    throw error;
  }
});

chatSchema.virtual('populatedAdmins').get(async function () {
  const admins = await mongoose
    .model('User')
    .find({ _id: { $in: this.admins } })
    .select('username bio profilePhoto');

  return admins;
});

chatSchema.virtual('populatedMembers').get(async function () {
  const members = await mongoose
    .model('User')
    .find({ _id: { $in: this.members } })
    .select('username bio profilePhoto');

  return members;
});

chatSchema.virtual('populatedJoinRequests').get(async function () {
  const joinRequests = await mongoose
    .model('User')
    .find({ _id: { $in: this.joinRequests.map((request) => request.userId) } })
    .select('username bio profilePhoto');

  return joinRequests;
});
*/
export default mongoose.model('Chat', chatSchema);
