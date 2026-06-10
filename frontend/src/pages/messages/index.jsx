import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { messagesAPI } from '../../services/messages.api';
import { userAPI } from '../../services/api';
import { employeeAPI } from '../../features/employees/services/employee.api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  BsEnvelope,
  BsEnvelopeOpen,
  BsSend,
  BsChat,
  BsPerson,
  BsTrash,
  BsArrowLeft,
} from 'react-icons/bs';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [allRecipients, setAllRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);

  // Compose form
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchEmployees();
    fetchUsers();
  }, [activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inbox') {
        const res = await messagesAPI.getReceived().catch(() => ({ data: [] }));
        setMessages(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'sent') {
        const res = await messagesAPI.getSent().catch(() => ({ data: [] }));
        setMessages(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'conversations') {
        const res = await messagesAPI.getConversations().catch(() => ({ data: [] }));
        setMessages(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll().catch(() => ({ data: [] }));
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll().catch(() => ({ data: [] }));
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Combine employees and users for recipient dropdown
    const combined = [
      ...employees.map(emp => ({
        id: emp.id,
        name: `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name}`,
        email: emp.email,
        role: emp.role || 'Employee',
        type: 'employee',
      })),
      ...users
        .filter(u => u.role === 'admin' || u.role === 'owner')
        .map(u => ({
          id: u.id,
          name: `${u.firstName || u.first_name} ${u.lastName || u.last_name}`,
          email: u.email,
          role: u.role,
          type: 'user',
        })),
    ];
    setAllRecipients(combined);
  }, [employees, users]);

  const handleSend = async e => {
    e.preventDefault();
    if (!recipientId || !content) {
      toast.error('Recipient and message content are required');
      return;
    }
    setSending(true);
    try {
      await messagesAPI.sendMessage({
        recipientId: Number(recipientId),
        subject: subject || 'No subject',
        content,
        type: 'general',
      });
      toast.success('Message sent');
      setRecipientId('');
      setSubject('');
      setContent('');
      setActiveTab('sent');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesAPI.deleteMessage(id);
      toast.success('Message deleted');
      fetchMessages();
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const openConversation = async conversationId => {
    setSelectedConversation(conversationId);
    try {
      const res = await messagesAPI.getConversation(conversationId).catch(() => ({ data: [] }));
      setConversationMessages(res.data || []);
    } catch {
      setConversationMessages([]);
    }
  };

  const getSenderName = msg => {
    if (msg.senderName) return msg.senderName;
    if (msg.sender_id && user?.id && String(msg.sender_id) === String(user.id)) return 'Me';
    const emp = employees.find(e => String(e.id) === String(msg.senderId || msg.sender_id));
    return emp
      ? `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name}`
      : `User #${msg.senderId || msg.sender_id}`;
  };

  const getRecipientName = msg => {
    if (msg.recipientName) return msg.recipientName;
    const emp = employees.find(e => String(e.id) === String(msg.recipientId || msg.recipient_id));
    return emp
      ? `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name}`
      : `User #${msg.recipientId || msg.recipient_id}`;
  };

  const renderMessageRow = msg => {
    const isInbox = activeTab === 'inbox';
    const isUnread = !msg.isRead && isInbox;
    const otherParty = isInbox ? getSenderName(msg) : getRecipientName(msg);
    const otherPartyId = isInbox
      ? msg.senderId || msg.sender_id
      : msg.recipientId || msg.recipient_id;
    const dateStr =
      msg.createdAt || msg.created_at
        ? new Date(msg.createdAt || msg.created_at).toLocaleString()
        : '';

    const handleReply = () => {
      setRecipientId(otherPartyId);
      setSubject(msg.subject ? `Re: ${msg.subject}` : '');
      setContent(`\n\n---\nOn ${dateStr}, ${otherParty} wrote:\n${msg.content}`);
      setActiveTab('compose');
    };

    return (
      <div
        key={msg.id}
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
          isUnread
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
        }`}
      >
        <div className="mt-0.5">
          {isUnread ? (
            <BsEnvelope className="text-blue-500" size={18} />
          ) : (
            <BsEnvelopeOpen className="text-slate-400" size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-medium truncate ${isUnread ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}
            >
              {msg.subject || 'No subject'}
            </span>
            <span className="text-xs text-slate-400 whitespace-nowrap">{dateStr}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {isInbox ? 'From' : 'To'}:{' '}
            <button
              onClick={handleReply}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {otherParty}
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {msg.content}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={handleReply}
            className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
            title="Reply"
          >
            <BsSend size={14} />
          </button>
          <button
            onClick={() => handleDelete(msg.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <BsTrash size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <p className="text-sm text-slate-500">Communicate with your team and supervisors</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setActiveTab('compose');
              setSelectedConversation(null);
            }}
          >
            <BsSend className="inline mr-1" size={14} /> New Message
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
          {[
            { key: 'inbox', label: 'Inbox', icon: BsEnvelope },
            { key: 'sent', label: 'Sent', icon: BsSend },
            { key: 'compose', label: 'Compose', icon: BsChat },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedConversation(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'compose' && (
          <Card>
            <form onSubmit={handleSend} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient
                </label>
                <select
                  className="form-select w-full"
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  required
                >
                  <option value="">Select recipient...</option>
                  {allRecipients.map(recipient => (
                    <option key={`${recipient.type}-${recipient.id}`} value={recipient.id}>
                      {recipient.name} ({recipient.email || recipient.role})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Message subject"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  className="form-input w-full"
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your message here..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('inbox')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {(activeTab === 'inbox' || activeTab === 'sent') && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BsEnvelopeOpen size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">
                    {activeTab === 'inbox' ? 'Your inbox is empty.' : 'No sent messages yet.'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('compose')}
                  >
                    Send a message
                  </Button>
                </div>
              </Card>
            ) : (
              messages.map(renderMessageRow)
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
