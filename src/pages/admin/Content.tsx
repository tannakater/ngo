import React, { useState } from 'react';
import { useNgoStore, News } from '../../store/useNgoStore';
import { uploadFile } from '../../lib/storage';
import { 
  FileText, Plus, Trash2, Edit3, Search, 
  Eye, Calendar, CheckCircle2, X, Upload, Newspaper
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminContent() {
  const { news, addNews, updateNews, deleteNews } = useNgoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<News | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Impact Story',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    author: 'Editorial Desk',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    status: 'Published' as 'Published' | 'Draft'
  });

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Impact Story',
      coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
      author: 'Editorial Desk',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Published'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (article: News) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || article.excerpt,
      category: article.category || 'Impact Story',
      coverImage: article.coverImage,
      author: article.author || 'Editorial Desk',
      date: article.date,
      status: article.status || 'Published'
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Stores into NGO/galleryimg according to Drive hierarchy!
      const url = await uploadFile(file, 'galleryimg');
      setFormData(prev => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Failed to upload story image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt) return;

    if (editingArticle) {
      updateNews(editingArticle.id, formData);
    } else {
      addNews(formData);
    }

    setShowModal(false);
  };

  const filteredNews = news.filter(n => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (n.title || '').toLowerCase().includes(term) ||
                          (n.excerpt || '').toLowerCase().includes(term);
    const matchesCat = categoryFilter === 'All' || n.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This story will be permanently removed from public feed.`}
        confirmText="Delete Story"
        onConfirm={() => deleteNews(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', title: '' })}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content & News Editorial</h1>
          <p className="text-xs text-slate-500 mt-1">Publish press releases, field impact stories, and community project milestones.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Write Story
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search news and articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Impact Story">Impact Story</option>
            <option value="Governance">Governance</option>
            <option value="Press Release">Press Release</option>
            <option value="Announcement">Announcement</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((article) => (
          <div key={article.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                {article.category || 'Article'}
              </div>
              <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {article.status || 'Published'}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{article.date}</span>
                  <span>&bull;</span>
                  <span>{article.author || 'Staff'}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {article.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(article)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      id: article.id,
                      title: article.title
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

      {/* Create / Edit Article Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingArticle ? 'Edit Story' : 'Create News Story'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Article Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50,000 People Given Safe Drinking Water"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Impact Story">Impact Story</option>
                    <option value="Governance">Governance</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Summary / Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short 1-2 sentence teaser..."
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Article Body</label>
                <textarea
                  rows={4}
                  placeholder="Full narrative details, quotes, and impact statistics..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Featured Image (Uploads to Drive /NGO/galleryimg)</label>
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
                    <img src={formData.coverImage} alt="Story Preview" className="h-full w-full object-cover" />
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
                  {editingArticle ? 'Save Changes' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
