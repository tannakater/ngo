import React, { useState } from 'react';
import { useNgoStore, Event } from '../../store/useNgoStore';
import { uploadFile } from '../../lib/storage';
import { 
  Calendar, MapPin, Clock, Plus, Trash2, Edit3, 
  Search, Users, Image as ImageIcon, X, Upload, CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminEvents() {
  const { events, addEvent, updateEvent, deleteEvent } = useNgoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '10:00 AM - 1:00 PM',
    location: '',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    category: 'Fundraiser',
    status: 'Upcoming' as 'Upcoming' | 'Completed' | 'Cancelled'
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '10:00 AM - 1:00 PM',
      location: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      category: 'Fundraiser',
      status: 'Upcoming'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt: Event) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      date: evt.date,
      time: evt.time || '',
      location: evt.location,
      description: evt.description || '',
      coverImage: evt.coverImage,
      category: evt.category || 'General',
      status: evt.status || 'Upcoming'
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Stores into NGO/eventimg according to drive hierarchy!
      const url = await uploadFile(file, 'eventimg');
      setFormData(prev => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Failed to upload event image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, formData);
    } else {
      addEvent(formData);
    }

    setShowModal(false);
  };

  const filteredEvents = events.filter(e => {
    const term = searchTerm.toLowerCase();
    return (e.title || '').toLowerCase().includes(term) ||
           (e.location || '').toLowerCase().includes(term) ||
           (e.category ? e.category.toLowerCase().includes(term) : false);
  });

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This event and its registration schedules will be permanently deleted.`}
        confirmText="Delete Event"
        onConfirm={() => deleteEvent(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', title: '' })}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & Field Activities</h1>
          <p className="text-xs text-slate-500 mt-1">Schedule community health camps, volunteer orientations, and charity galas.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Create Event
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => (
          <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              <img src={evt.coverImage} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                {evt.category || 'Event'}
              </div>
              <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {evt.status || 'Upcoming'}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{evt.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {evt.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{evt.date}</span>
                    {evt.time && <span className="text-slate-400">({evt.time})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(evt)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      id: evt.id,
                      title: evt.title
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Eye Treatment Camp"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov 14, 2026"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 2:00 PM"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Healthcare">Healthcare</option>
                    <option value="Fundraiser">Fundraiser</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Relief Distribution">Relief Distribution</option>
                    <option value="Community">Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Central Community Hall"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the schedule and objective..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cover Image (Uploads to Drive /NGO/eventimg)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {uploading && <span className="text-xs text-emerald-600 font-medium">Uploading to Drive...</span>}
                </div>
                {formData.coverImage && (
                  <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img src={formData.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
