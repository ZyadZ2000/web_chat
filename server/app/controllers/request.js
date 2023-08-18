// NPM Modules
import mongoose from 'mongoose';

// Custom Modules
import Request from '../../models/request.js';
import { GroupChat } from '../../models/chat.js';

export async function delete_request(req, res, next) {
  try {
    const { requestId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.type === 'privateRequest' || request.type === 'friendRequest') {
      if (request.sender !== userId)
        return res.status(401).json({ message: 'Not authorized' });
    } else if (request.type === 'groupRequest') {
      const chat = await GroupChat.findOne({
        _id: request.chat,
        $or: [{ admin: userId }, { creator: userId }],
      });
      if (!chat) return res.status(401).json({ message: 'Not authorized' });
    }

    await request.deleteOne();
    return res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
