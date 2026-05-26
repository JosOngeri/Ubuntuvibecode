const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId', messageController.getConversationMessages);
router.get('/received', messageController.getReceivedMessages);
router.get('/sent', messageController.getSentMessages);
router.get('/complaints', messageController.getComplaints);
router.post('/complaints/:id/resolve', messageController.resolveComplaint);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
