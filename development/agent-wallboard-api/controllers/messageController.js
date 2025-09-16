const Message = require('../models/Message');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// POST /api/messages
const createMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;
    const msg = await Message.create({ from, to, message });

    // ส่งผ่าน WebSocket
    const io = req.app.get('io');
    io.emit('newMessage', {
      from,
      to,
      message,
      timestamp: msg.timestamp
    });

    return sendSuccess(res, 'Message sent', msg, 201);
  } catch (error) {
    return sendError(res, 'Failed to send message', 500, error);
  }
};

// GET /api/messages/:agentCode
const getMessagesForAgent = async (req, res) => {
  try {
    const { agentCode } = req.params;

    const messages = await Message.find({
      $or: [
        { to: agentCode },
        { to: 'ALL' }
      ]
    }).sort({ timestamp: -1 });

    return sendSuccess(res, 'Messages retrieved', messages);
  } catch (error) {
    return sendError(res, 'Failed to get messages', 500, error);
  }
};

module.exports = {
  createMessage,
  getMessagesForAgent
};
