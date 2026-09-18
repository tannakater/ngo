import React, { useState } from 'react';
import { useNgoStore, TransparencyDoc } from '../../store/useNgoStore';
import { uploadFile } from '../../lib/storage';
import { 
  FileText, Plus, Trash2, Download, Search, 
  Upload, CheckCircle2, X, ShieldCheck, Edit3
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminTransparency() {
  const { documents, addDocument, updateDocument, deleteDocument } = useNgoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TransparencyDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    category: 'Financial Audit' as TransparencyDoc['category'],
    year: new Date().getFullYear().toString(),
    fileSize: '2.5 MB',
    fileUrl: '#',
    description: ''
  });

  const openAddModal = () => {
    setEditingDoc(null);
    setFormData({
      title: '',
      category: 'Financial Audit',
      year: new Date().getFullYear().toString(),
      fileSize: '2.5 MB',
      fileUrl: '#',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (doc: TransparencyDoc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      category: doc.category,
      year: doc.year,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      description: doc.description || ''
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file, 'documents');
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setFormData(prev => ({
        ...prev,
        fileUrl: url,
        fileSize: sizeMb,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    } catch (err) {
      console.error('Failed to upload document', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingDoc) {
      updateDocument(editingDoc.id, formData);
    } else {
      addDocument(formData);
    }

    setShowModal(false);
    setEditingDoc(null);
  };

  const filteredDocs = documents.filter(d => {
    const term = searchTerm.toLowerCase();
    return (d.title || '').toLowerCase().includes(term) ||
           (d.category || '').toLowerCase().includes(term) ||
           (d.year ? String(d.year).includes(term) : false);
  });

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This file will be removed from public disclosure.`}
        confirmText="Delete Document"
        onConfirm={() => deleteDocument(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', title: '' })}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance & Transparency Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish official audits, tax compliance, and legal disclosures directly to public supporters.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Upload Disclosure File
        </button>
      </div>

      {/* Compliance banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
        <div className="text-xs text-emerald-900">
          <span className="font-bold">Public Accountability Standard:</span> All uploaded records automatically sync with your public <span className="font-mono font-semibold">/transparency</span> portal to maintain public trust.
        </div>
      </div>

      {/* Table search & list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title, category, year..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            {filteredDocs.length} Total Records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">Fiscal Year</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Published Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No transparency documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          {doc.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {doc.year}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {doc.fileSize}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {doc.uploadedAt}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([`Official Public Document: ${doc.title}\nCategory: ${doc.category}\nYear: ${doc.year}`], {type: 'text/plain'});
                            element.href = URL.createObjectURL(file);
                            element.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Document"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              id: doc.id,
                              title: doc.title
                            });
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDoc ? 'Edit Disclosure Document' : 'Upload Public Disclosure Document'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Audited Financials 2026"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Classification Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Annual Report">Annual Report</option>
                    <option value="Financial Audit">Financial Audit</option>
                    <option value="Tax Exemption">Tax Exemption</option>
                    <option value="Governance & Bylaws">Governance & Bylaws</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fiscal Year</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audit / Summary Description</label>
                <textarea
                  rows={3}
                  placeholder="Summary of certified accountant statement or regulatory approval..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Upload to Drive */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload File (Saves to Drive /NGO/documents)</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploading && <p className="text-xs text-emerald-600 mt-1 font-medium">Uploading to Drive (/NGO/documents)...</p>}
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
                  {editingDoc ? 'Save Changes' : 'Publish to Public Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
