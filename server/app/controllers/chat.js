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

    return res.status(201).json({ message: 'chat created successfully', chat });
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
      const exactMatchRegex = new RegExp(`^${name}$`, 'i'); // Exact match
      const startsWithRegex = new RegExp(`^${name}`, 'i'); // Start with
      const endsWithRegex = new RegExp(`${name}$`, 'i'); // End with
      const containsRegex = new RegExp(name, 'i'); // Contains

      chats = await GroupChat.find({
        $or: [
          { name: exactMatchRegex },
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
    if (!chats) return res.status(404).json({ message: 'No chats found' });

    return res.status(200).json({ chats });
  } catch (error) {
    return next(error);
  }
}

export function get_chat(onlyMessages) {
  return async function (req, res, next) {
    try {
      const { chatId } = req.body;
      const userId = req.userId;
      const page = req.query.page || 1;
      let chat;
      if (!onlyMessages) {
        chat = await Chat.findOne({
          _id: chatId,
          $or: [{ members: userId }, { users: userId }, { creator: userId }],
        })
          .select(
            '_id admins type users members creator photo name description createdAt'
          )
          .select({
            messages: { $slice: [(page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE] },
          })
          .populate(
            'members',
            '_id username profilePhoto onlineStatus bio createdAt'
          )
          .populate(
            'users',
            '_id username profilePhoto onlineStatus bio createdAt'
          )
          .populate(
            'creator',
            '_id username profilePhoto onlineStatus bio createdAt'
          );
      } else {
        chat = await Chat.findOne({
          _id: chatId,
          $or: [{ members: userId }, { users: userId }, { creator: userId }],
        }).select({
          messages: { $slice: [(page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE] },
        });
      }
      if (!chat) return res.status(404).json({ message: 'chat not found' });

      return res.status(200).json({ chat });
    } catch (error) {
      return next(error);
    }
  };
}

export async function get_chat_requests(req, res, next) {
  try {
    const { chatId } = req.body;
    const page = req.query.page || 1;
    const userId = req.userId;

    const chat = await GroupChat.findOne({
      _id: chatId,
      $or: [{ admins: userId }, { creator: userId }],
    }).select('_id');

    if (!chat)
      return res.status(401).json({
        message: 'chat not found or unauthorized',
      });

    const requests = await Request.find({
      chat: chat._id,
    })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate(
        'sender',
        '_id username profilePhoto onlineStatus bio createdAt'
      );

    if (!requests)
      return res.status(404).json({ message: 'No requests were found' });

    return res.status(200).json({ requests });
  } catch (error) {
    return next(error);
  }
}
