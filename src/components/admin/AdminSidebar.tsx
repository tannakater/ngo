import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Building, Users, Calendar, Megaphone, 
  IdCard, Settings, LogOut, Heart, Shield,
  MessageSquare, FileText, Briefcase, Activity, HardDrive,
  ExternalLink, Globe, Sparkles, HeartHandshake, ClipboardList
} from 'lucide-react';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';
import { cn } from '../../lib/utils';
import { signOutAdmin, getCurrentAdminUser } from '../../lib/auth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen?: boolean, setSidebarOpen?: (open: boolean) => void }) {
  const { organization, members } = useOrgStore();
  const { donations } = useNgoStore();

  const pendingDonationsCount = donations.filter(d => d.status === 'Pending').length;
  const pendingVolunteersCount = members.filter(m => 
    (m.role === 'Volunteer' || m.designation?.toLowerCase().includes('applicant')) && 
    (m.status === 'Pending' || m.status === 'Inactive')
  ).length;

  const adminUser = getCurrentAdminUser();
  const isMasterAdmin = adminUser?.role === 'admin';

  const sections: NavSection[] = [
    {
      title: 'Core & Fundraising',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { 
          name: 'Donations', 
          path: '/admin/donations', 
          icon: Heart,
          badge: pendingDonationsCount > 0 ? pendingDonationsCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        { name: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
        { name: 'Programs', path: '/admin/programs', icon: Briefcase },
      ]
    },
    {
      title: 'Community & Credentialing',
      items: [
        { name: 'Members & Staff', path: '/admin/people', icon: Users },
        { 
          name: 'Volunteer Requests', 
          path: '/admin/volunteers', 
          icon: HeartHandshake,
          badge: pendingVolunteersCount > 0 ? pendingVolunteersCount : undefined,
          badgeColor: 'bg-amber-500 text-white font-bold'
        },
        ...(isMasterAdmin ? [{ name: 'ID Cards', path: '/admin/id-cards', icon: IdCard }] : []),
        { name: 'Events', path: '/admin/events', icon: Calendar },
      ]
    },
    {
      title: 'Communications',
      items: [
        { name: 'News & Stories', path: '/admin/content', icon: FileText },
        { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
      ]
    },
    {
      title: 'Management & Files',
      items: [
        ...(isMasterAdmin ? [{ name: 'System Users', path: '/admin/system-users', icon: Shield }] : []),
        ...(isMasterAdmin ? [{ name: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList }] : []),
        { name: 'Transparency', path: '/admin/transparency', icon: Activity },
        ...(isMasterAdmin ? [
          { name: 'Organization', path: '/admin/org-settings', icon: Building },
          { name: 'Settings', path: '/admin/settings', icon: Settings }
        ] : []),
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOutAdmin();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 select-none",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 bg-slate-950/60 border-b border-slate-800/80">
        <Link to="/admin" className="flex items-center gap-3 overflow-hidden group">
          <img src="/daksheba.jpg" alt="Logo" className="h-9 w-9 object-cover rounded-lg shrink-0 border border-slate-700" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate tracking-tight group-hover:text-emerald-400 transition-colors">
              {organization.name || 'NGO Platform'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-400/90 flex items-center gap-2">
              Admin Workspace
              <span className="px-1.5 py-0.2 bg-emerald-900/80 text-emerald-300 rounded font-mono text-[9px] border border-emerald-700/50">V33</span>
            </span>
          </div>
        </Link>
      </div>
      
      {/* Categorized Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 select-none">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen?.(false)}
                  className={({ isActive }) =>
                    cn(
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-medium',
                      'group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-150'
                    )
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <item.icon
                      className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={cn(
                      'px-1.5 py-0.5 text-[10px] font-black rounded-full leading-none shrink-0',
                      item.badgeColor || 'bg-emerald-500 text-white'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Quick Links & User */}
      <div className="flex flex-col shrink-0 border-t border-slate-800/80 p-3 bg-slate-950/40 gap-2">
        {/* Quick View Public Website */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all border border-slate-800/60"
          title="Open Public Website in a new tab"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Website</span>
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* User profile & Logout */}
        {(() => {
          const currentAdmin = getCurrentAdminUser();
          const initials = (currentAdmin?.displayName || currentAdmin?.email || 'Admin')
            .slice(0, 2)
            .toUpperCase();
          return (
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {currentAdmin?.displayName || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentAdmin?.email || 'admin@ngo.org'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleLogout} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Sign out of Admin session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
