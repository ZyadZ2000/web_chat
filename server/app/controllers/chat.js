import mongoose from 'mongoose';
// Custom modules
import Chat, { GroupChat } from '../../models/chat.js';
import User from '../../models/user.js';

const ITEMS_PER_PAGE = 20;

export async function create_chat(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { chatName, chatDescription } = req.body;

    const photoFileName = req.file?.filename || 'default_profile.png';

    const chat = new GroupChat({
      type: 'groupChat',
      name: chatName,
      description: chatDescription || ' ',
      photo: photoFileName,
      creator: req.userId,
      members: [req.userId],
    });

    await User.updateOne(
      { _id: req.userId },
      { $push: { chats: chat._id } }
    ).session(session);

    await GroupChat.create([chat], { session: session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ chat });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
}

export async function search_chats(req, res, next) {
  try {
    const { name } = req.query;
    const page = req.query.page || 1;

    let chats;
    if (name) {
      const startsWithRegex = new RegExp(`^${name}`, 'i'); // Start with
      const endsWithRegex = new RegExp(`${name}$`, 'i'); // End with
      const containsRegex = new RegExp(name, 'i'); // Contains

      chats = await GroupChat.find({
        $or: [
          { name: startsWithRegex },
          { name: endsWithRegex },
          { name: containsRegex },
        ],
      })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate('creator', '_id username photo onlineStatus bio')
        .select('_id name photo description createdAt');
    } else {
      chats = await GroupChat.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate('creator', '_id username photo onlineStatus bio createdAt')
        .select('_id name photo description createdAt');
    }

    return res.status(200).json({ chats });
  } catch (error) {
    return next(error);
  }
}

export function get_chat(onlyMessages) {
  return async function (req, res, next) {
    try {
      const chatId = new mongoose.Types.ObjectId(req.body.chatId);
      const userId = req.userId;
      const page = req.query.page || 1;
      let chat;
      if (!onlyMessages) {
        chat = await Chat.aggregate([
          {
            $match: { _id: chatId },
          },
          {
            $addFields: {
              isAuthorized: {
                $cond: {
                  if: { $eq: ['$type', 'groupChat'] },
                  then: { $in: [userId, '$members'] },
                  else: { $in: [userId, '$users'] },
                },
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'creator',
              foreignField: '_id',
              as: 'creator',
            },
          },
          {
            $project: {
              _id: 1,
              type: 1,
              isAuthorized: 1,
              messages: {
                $slice: [
                  '$messages',
                  (page - 1) * ITEMS_PER_PAGE,
                  ITEMS_PER_PAGE,
                ],
              },
              admins: 1,
              users: 1,
              members: 1,
              creator: 1,
              photo: 1,
              name: 1,
              description: 1,
              createdAt: 1,
            },
          },
        ]);
        chat = chat[0];

        if (!chat) return res.status(404).json({ message: 'chat not found' });
        if (!chat.isAuthorized)
          return res.status(402).json({ message: 'unauthorized' });

        if (chat.type === 'groupChat') {
          chat.members = await User.find(
            { _id: { $in: chat.members } },
            '_id username photo onlineStatus bio createdAt'
          );
          chat.admins = await User.find(
            { _id: { $in: chat.admins } },
            '_id username photo onlineStatus bio createdAt'
          );
        } else {
          chat.users = await User.find(
            { _id: { $in: chat.users } },
            '_id username photo onlineStatus bio createdAt'
          );
        }
      } else {
        chat = await Chat.aggregate([
          {
            $match: { _id: chatId },
          },
          {
            $addFields: {
              isAuthorized: {
                $cond: {
                  if: { $eq: ['$type', 'groupChat'] },
                  then: { $in: [userId, '$members'] },
                  else: { $in: [userId, '$users'] },
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              messages: {
                $slice: [
                  '$messages',
                  (page - 1) * ITEMS_PER_PAGE,
                  ITEMS_PER_PAGE,
                ],
              },
              isAuthorized: 1,
            },
          },
        ]);

        chat = chat[0];

        if (!chat) return res.status(404).json({ message: 'chat not found' });
        if (!chat.isAuthorized)
          return res.status(402).json({ message: 'unauthorized' });
      }
      return res.status(200).json({ chat });
    } catch (error) {
      return next(error);
    }
  };
}

export async function get_chat_requests(req, res, next) {
  try {
    const chatId = new mongoose.Types.ObjectId(req.body.chatId);
    const page = req.query.page || 1;
    const userId = req.userId;

    let chat = await GroupChat.aggregate([
      { $match: { _id: chatId } },
      {
        $addFields: {
          isAuthorized: {
            $cond: {
              if: {
                $or: [
                  { $in: [userId, '$admins'] },
                  { $eq: ['$creator', userId] },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isAuthorized: 1,
        },
      },
    ]);

    chat = chat[0];

    if (!chat) return res.status(404).json({ message: 'chat not found' });
    if (!chat.isAuthorized)
      return res.status(402).json({ message: 'unauthorized' });

    const requests = await Request.find({
      chat: chat._id,
    })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate(
        'sender',
        '_id username profilePhoto onlineStatus bio createdAt'
      );

    return res.status(200).json({ requests });
  } catch (error) {
    return next(error);
  }
}
