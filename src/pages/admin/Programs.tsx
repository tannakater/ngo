import React, { useState, useRef, useEffect } from 'react';
import { useNgoStore, Project } from '../../store/useNgoStore';
import { uploadFile } from '../../lib/storage';
import { 
  Briefcase, Plus, Filter, Search, Edit3, Trash2, 
  X, MapPin, DollarSign, Upload, CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminPrograms() {
  const { projects, addProject, updateProject, deleteProject } = useNgoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  }, [searchTerm, statusFilter]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Water & Sanitation',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    location: '',
    progress: 50,
    status: 'Active' as 'Active' | 'Completed' | 'Draft',
    budget: 50000
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      category: 'Water & Sanitation',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
      location: '',
      progress: 0,
      status: 'Active',
      budget: 50000
    });
    setShowModal(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      category: proj.category || 'General',
      description: proj.description,
      coverImage: proj.coverImage,
      location: proj.location,
      progress: proj.progress,
      status: proj.status,
      budget: proj.budget
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Stores into NGO/projectimg according to Drive hierarchy!
      const url = await uploadFile(file, 'projectimg');
      setFormData(prev => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Failed to upload project cover image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return;

    if (editingProject) {
      updateProject(editingProject.id, formData);
    } else {
      addProject(formData);
    }

    setShowModal(false);
  };

  const filteredProjects = projects.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (p.title || '').toLowerCase().includes(term) ||
                          (p.location || '').toLowerCase().includes(term) ||
                          (p.description || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This program and its field records will be permanently removed.`}
        confirmText="Delete Project"
        onConfirm={() => deleteProject(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', title: '' })}
      />
      
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programs & Projects</h1>
          <p className="mt-1 text-xs text-slate-500">Manage all humanitarian fieldwork, clean water plants, and school building projects.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            type="button" 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 bg-slate-50 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div ref={tableContainerRef} className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 pl-4 sm:pl-6 pr-3 text-left">
                  Project Title
                </th>
                <th scope="col" className="px-3 py-3 text-left whitespace-nowrap">Location</th>
                <th scope="col" className="px-3 py-3 text-left whitespace-nowrap">Budget</th>
                <th scope="col" className="px-3 py-3 text-left whitespace-nowrap">Progress</th>
                <th scope="col" className="py-3 pl-3 pr-4 sm:pr-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No programs match your filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 pl-4 sm:pl-6 pr-3">
                      <div className="flex items-center min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                          <img className="h-9 w-9 object-cover" src={project.coverImage} alt={project.title} />
                        </div>
                        <div className="ml-3 min-w-0 max-w-[220px] sm:max-w-xs md:max-w-sm">
                          <div className="font-bold text-slate-900 truncate" title={project.title}>{project.title}</div>
                          <div className="text-slate-500 text-[11px] truncate" title={project.description}>{project.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{project.location}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-900 font-bold whitespace-nowrap">${project.budget.toLocaleString()}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          project.status === 'Completed' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {project.status}
                        </span>
                        <div className="w-16 sm:w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden shrink-0">
                          <div 
                            className={`h-1.5 rounded-full ${project.progress === 100 ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 pl-3 pr-4 sm:pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {project.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => updateProject(project.id, { status: 'Completed', progress: 100 })}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="Mark as Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(project)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              id: project.id,
                              title: project.title
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

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Water Initiative"
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
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Environment">Environment</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coastal Districts"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Budget ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Completion Progress ({formData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail the scope and beneficiaries..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cover Image (Uploads to Drive /NGO/projectimg)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploading && <p className="text-xs text-emerald-600 mt-1 font-medium">Uploading to Drive...</p>}
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
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
