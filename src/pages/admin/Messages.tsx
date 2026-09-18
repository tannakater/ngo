import React, { useState } from 'react';
import { useNgoStore, ContactMessage } from '../../store/useNgoStore';
import { 
  MessageSquare, Mail, Phone, Clock, Search, 
  CheckCircle2, Trash2, Reply, Eye, X, Filter
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminMessages() {
  const { messages, markMessageRead, deleteMessage } = useNgoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const filteredMessages = messages.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (m.name || '').toLowerCase().includes(term) ||
                          (m.email || '').toLowerCase().includes(term) ||
                          (m.subject || '').toLowerCase().includes(term) ||
                          (m.message || '').toLowerCase().includes(term);
    const matchesUnread = !filterUnread || !m.isRead;
    return matchesSearch && matchesUnread;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleOpenMessage = (m: ContactMessage) => {
    setSelectedMessage(m);
    if (!m.isRead) {
      markMessageRead(m.id);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Message"
        message={`Are you sure you want to delete this message from "${deleteConfirm.name}"? This inquiry will be permanently removed.`}
        confirmText="Delete Message"
        onConfirm={() => {
          deleteMessage(deleteConfirm.id);
          if (selectedMessage?.id === deleteConfirm.id) {
            setSelectedMessage(null);
          }
        }}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbound Messages & Feedback</h1>
          <p className="text-xs text-slate-500 mt-1">Direct inquiries submitted by visitors, partners, and donors via the Contact Us form.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sender, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterUnread(!filterUnread)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filterUnread
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {filterUnread ? 'Showing Unread Only' : 'Show All Messages'}
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No messages in inbox</h3>
            <p className="text-xs text-slate-500 mt-1">Inquiries submitted on the website's Contact Us page will arrive here.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
                !msg.isRead ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${!msg.isRead ? 'bg-emerald-600' : 'bg-transparent'}`}></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{msg.name}</span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500 font-mono">{msg.email}</span>
                    {msg.phone && (
                      <>
                        <span className="text-xs text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-500">{msg.phone}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 truncate mb-1">{msg.subject}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{msg.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenMessage(msg)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Read
                </button>
                <a
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      id: msg.id,
                      name: msg.name
                    });
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Reader Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Inquiry Details
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedMessage.subject}</h2>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">From:</span>
                <span className="font-bold text-slate-900">{selectedMessage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800">{selectedMessage.email}</span>
              </div>
              {selectedMessage.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{selectedMessage.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Date Received:</span>
                <span className="text-slate-700">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedMessage.message}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm({
                    isOpen: true,
                    id: selectedMessage.id,
                    name: selectedMessage.name
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Message
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Reply className="w-3.5 h-3.5" /> Compose Reply
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
