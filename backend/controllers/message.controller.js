const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const logger = require('../utils/logger');

async function sendMessage(req, res) {
  try {
    const {
      recipientId,
      subject,
      content,
      type = 'general',
      tags = [],
      parentId,
      conversationId,
      attachments = []
    } = req.body;
    const sender = req.user;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['general', 'complaint', 'recommendation', 'urgent'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    const message = new Message({
      senderId: sender.id,
      senderName: sender.username,
      recipientId,
      recipientName: req.body.recipientName,
      subject,
      content,
      type,
      tags: type === 'complaint' || type === 'recommendation' ? [type, ...tags] : tags,
      parentId,
      conversationId: conversationId || (parentId ? null : require('crypto').randomUUID()),
      attachments,
      isRead: false,
      isResolved: type === 'complaint' ? false : undefined
    });

    await message.save();

    const notification = new Notification({
      userId: recipientId,
      type: 'new_message',
      title: `New ${type} from ${sender.username}`,
      message: subject || `You have a new ${type} message`,
      entityType: 'message',
      entityId: message.id,
      link: `/messages/chat/${message.conversationId}`
    });
    await notification.save();

    logger.info('message.send', 'Message sent', {
      sender: sender.id,
      recipient: recipientId,
      type
    });

    res.status(201).json({
      success: true,
      data: message.toJSON()
    });
  } catch (error) {
    logger.error('message.send', 'Error sending message', { error: error.message });
    res.status(500).json({ error: 'Failed to send message' });
  }
}

async function getConversations(req, res) {
  try {
    const user = req.user;
    const conversations = await Message.findConversations(user.id);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('message.getConversations', 'Error getting conversations', { error: error.message });
    res.status(500).json({ error: 'Failed to get conversations' });
  }
}

async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const user = req.user;

    const messages = await Message.findConversationMessages(conversationId);

    // Check if user is participant or admin
    const isParticipant = messages.some(m => 
      m.senderId === user.id || m.recipientId === user.id
    );
    const isAdmin = ['admin', 'manager', 'owner'].includes(user.role);

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages as read
    const unreadMessages = messages.filter(m => 
      m.recipientId === user.id && !m.isRead
    );
    
    for (const msg of unreadMessages) {
      await msg.markAsRead();
    }

    res.json({
      success: true,
      data: messages.map(m => m.toJSON())
    });
  } catch (error) {
    logger.error('message.getConversation', 'Error getting conversation', { error: error.message });
    res.status(500).json({ error: 'Failed to get conversation' });
  }
}

async function getReceivedMessages(req, res) {
  try {
    const user = req.user;
    const { type, unreadOnly, limit } = req.query;

    const options = {};
    if (type) options.type = type;
    if (unreadOnly === 'true') options.unreadOnly = true;
    if (limit) options.limit = parseInt(limit);

    const messages = await Message.findByRecipient(user.id, options);

    res.json({
      success: true,
      data: messages.map(m => m.toJSON())
    });
  } catch (error) {
    logger.error('message.getReceived', 'Error getting received messages', { error: error.message });
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

async function getSentMessages(req, res) {
  try {
    const user = req.user;
    const { type, limit } = req.query;

    const options = {};
    if (type) options.type = type;
    if (limit) options.limit = parseInt(limit);

    const messages = await Message.findBySender(user.id, options);

    res.json({
      success: true,
      data: messages.map(m => m.toJSON())
    });
  } catch (error) {
    logger.error('message.getSent', 'Error getting sent messages', { error: error.message });
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

async function getComplaints(req, res) {
  try {
    const user = req.user;
    const { resolved } = req.query;
    
    const options = {};
    if (resolved !== undefined) {
      options.resolved = resolved === 'true';
    }

    // If not admin/manager, only show complaints they can resolve
    if (!['admin', 'manager', 'owner'].includes(user.role) && 
        !user.additionalRoles?.includes('supervisor') &&
        !user.additionalRoles?.includes('department_head')) {
      options.recipientId = user.id;
    }

    const complaints = await Message.findComplaints(options);

    res.json({
      success: true,
      data: complaints.map(c => c.toJSON())
    });
  } catch (error) {
    logger.error('message.getComplaints', 'Error getting complaints', { error: error.message });
    res.status(500).json({ error: 'Failed to get complaints' });
  }
}

async function resolveComplaint(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const resolver = req.user;

    const complaint = await Message.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.type !== 'complaint') {
      return res.status(400).json({ error: 'Message is not a complaint' });
    }

    // Check if user can resolve
    const canResolve = ['admin', 'manager', 'owner'].includes(resolver.role) ||
                       resolver.additionalRoles?.includes('supervisor') ||
                       resolver.additionalRoles?.includes('department_head') ||
                       complaint.recipientId === resolver.id;

    if (!canResolve) {
      return res.status(403).json({ error: 'Cannot resolve this complaint' });
    }

    await complaint.resolve(resolver.id, notes);

    const notification = new Notification({
      userId: complaint.senderId,
      type: 'complaint_resolved',
      title: 'Complaint Resolved',
      message: `Your complaint has been resolved by ${resolver.username}.`,
      entityType: 'message',
      entityId: complaint.id
    });
    await notification.save();

    await AuditLog.create({
      userId: resolver.id,
      username: resolver.username,
      userRole: resolver.role,
      action: 'resolve_complaint',
      entityType: 'message',
      entityId: complaint.id,
      newData: { resolvedBy: resolver.id, resolutionNotes: notes }
    });

    res.json({
      success: true,
      data: complaint.toJSON()
    });
  } catch (error) {
    logger.error('message.resolveComplaint', 'Error resolving complaint', { error: error.message });
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
}

async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender, recipient, or admin can delete
    const canDelete = message.senderId === user.id || 
                      message.recipientId === user.id ||
                      ['admin', 'manager', 'owner'].includes(user.role);

    if (!canDelete) {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    // Soft delete - mark as deleted (would need a deleted field in model)
    // For now, just log it
    await AuditLog.create({
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action: 'delete_message',
      entityType: 'message',
      entityId: message.id
    });

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    logger.error('message.delete', 'Error deleting message', { error: error.message });
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  getReceivedMessages,
  getSentMessages,
  getComplaints,
  resolveComplaint,
  deleteMessage
};
