import React, { useState } from 'react';
import { useOrgStore } from '../../store/useOrgStore';
import { Shield, Plus, Trash2, Edit3, Save, X, User, KeyRound, CheckCircle2, Info } from 'lucide-react';

export function SystemUsers() {
  const { webUsers, organization, addWebUser, updateWebUser, removeWebUser } = useOrgStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'moderator' as 'admin' | 'moderator'
  });

  const masterEmails = [
    'prankp343@gmail.com',
    'admin@ngo.org',
    organization?.email
  ].filter(Boolean).map(e => e!.toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    if (editingId) {
      updateWebUser(editingId, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      });
      setEditingId(null);
    } else {
      addWebUser({
        name: formData.name.trim() || formData.email.split('@')[0],
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      });
      setIsAdding(false);
    }
    setFormData({ name: '', email: '', role: 'moderator' });
  };

  const handleEdit = (user: any) => {
    setFormData({ name: user.name, email: user.email, role: user.role });
    setEditingId(user.id);
    setIsAdding(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" /> System Users & Admins
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage administrative access for secondary accounts and field moderators across all devices.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'moderator' });
              setIsAdding(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add System User
          </button>
        )}
      </div>

      {/* Login Instructions Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">How Secondary System Accounts Log In:</p>
          <p className="text-xs text-emerald-800 leading-relaxed">
            1. Add the team member's email address below with the desired role (<span className="font-semibold">Administrator</span> or <span className="font-semibold">Moderator</span>).<br />
            2. The user can now open the login page on any device and enter their registered email with their preferred password (minimum 6 characters) to sign in or use <strong>Sign in with Google</strong>.
          </p>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit System User' : 'Add New System User'}</h2>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Sarah Jenkins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. sarah@domain.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Role</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="admin">Administrator (Full Access to Members, ID Cards, Campaigns, Finance)</option>
                <option value="moderator">Moderator (Field Verification & Member Records Access)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition shadow-sm"
              >
                {editingId ? 'Save Changes' : 'Grant System Access'}
              </button>
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">User Account</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Role / Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Super Admin Permanent Row */}
            <tr className="bg-slate-50/50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    SA
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      Master Administrator
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Root Super Admin
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">prankp343@gmail.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Root Access
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-slate-400 italic">
                Permanent Root
              </td>
            </tr>

            {/* Configured System Users */}
            {webUsers.map(user => {
              const isMaster = masterEmails.includes(user.email.trim().toLowerCase());
              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrator' : 'Moderator'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!isMaster && (
                        <button
                          onClick={() => removeWebUser(user.id)}
                          title="Revoke Access"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

