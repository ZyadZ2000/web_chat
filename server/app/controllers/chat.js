import Chat, { GroupChat } from '../../models/chat.js';

export async function create_chat(req, res, next) {
  try {
    const { chatName, chatDescription } = req.body;

    const photoFileName = req.file?.filename || 'default_profile.png';

    const chat = new GroupChat({
      type: 'group',
      name: chatName,
      description: chatDescription || ' ',
      photo: photoFileName,
      creatorId: req.userId,
      members: [req.userId],
    });

    await chat.save();

    return res.status(201).json({ message: 'Chat created successfully', chat });
  } catch (error) {
    return next(error);
  }
}

export async function search_chats(req, res, next) {
  try {
    const { name } = req.query;
    const exactMatchRegex = new RegExp(`^${name}$`, 'i'); // Exact match
    const startsWithRegex = new RegExp(`^${name}`, 'i'); // Start with
    const endsWithRegex = new RegExp(`${name}$`, 'i'); // End with
    const containsRegex = new RegExp(name, 'i'); // Contains

    const chats = await Chat.find({
      $or: [
        { name: exactMatchRegex },
        { name: startsWithRegex },
        { name: endsWithRegex },
        { name: containsRegex },
      ],
    })
      .populate('creator', '_id username photo onlineStatus bio')
      .select('_id name photo description createdAt');

    if (!chats) return res.status(404).json({ message: 'No chats found' });

    return res.status(200).json({ chats });
  } catch (error) {
    return next(error);
  }
}

export async function get_chat(req, res, next) {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, members: req.userId })
      .populate('members', '_id username photo onlineStatus bio')
      .populate('users', '_id username photo onlineStatus bio')
      .populate('creator', '_id username photo onlineStatus bio');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    return res.status(200).json({ chat });
  } catch (error) {
    return next(error);
  }
}
