import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Globe, ExternalLink, Heart, Check, X, Shield } from 'lucide-react';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';

const routeTitles: Record<string, { title: string; category: string }> = {
  '/admin': { title: 'Executive Dashboard', category: 'Overview' },
  '/admin/donations': { title: 'Donations & Receipts', category: 'Fundraising' },
  '/admin/campaigns': { title: 'Fundraising Campaigns', category: 'Fundraising' },
  '/admin/programs': { title: 'Programs & Causes', category: 'Field Work' },
  '/admin/people': { title: 'Members & Volunteers', category: 'Community' },
  '/admin/id-cards': { title: 'ID Card Management', category: 'Community' },
  '/admin/id-cards/print': { title: 'Batch Print ID Cards', category: 'Community' },
  '/admin/events': { title: 'Events Calendar', category: 'Community' },
  '/admin/content': { title: 'News & Stories', category: 'Media' },
  '/admin/messages': { title: 'Messages & Inquiries', category: 'Media' },
  '/admin/drive': { title: 'Drive File Storage', category: 'System' },
  '/admin/transparency': { title: 'Transparency & Governance', category: 'System' },
  '/admin/org-settings': { title: 'Organization Profile', category: 'System' },
  '/admin/settings': { title: 'Admin Settings', category: 'System' },
};

const searchablePages = [
  { name: 'Dashboard', path: '/admin', desc: 'System overview and impact stats' },
  { name: 'Donations & Approvals', path: '/admin/donations', desc: 'Verify donations and send receipts' },
  { name: 'Campaigns', path: '/admin/campaigns', desc: 'Manage live fundraising campaigns' },
  { name: 'Programs & Causes', path: '/admin/programs', desc: 'Track field projects and budgets' },
  { name: 'Members & Volunteers', path: '/admin/people', desc: 'Directory, rosters, and credentials' },
  { name: 'ID Card Templates & Print', path: '/admin/id-cards', desc: 'Generate and batch print ID cards' },
  { name: 'Events', path: '/admin/events', desc: 'Upcoming field events and drives' },
  { name: 'News & Stories', path: '/admin/content', desc: 'Publish blogs, news, and press releases' },
  { name: 'Messages', path: '/admin/messages', desc: 'Public inquiries and contact form submissions' },
  { name: 'Drive Storage', path: '/admin/drive', desc: 'Official documents, badges, and folders' },
  { name: 'Transparency', path: '/admin/transparency', desc: 'Financial records and compliance documents' },
  { name: 'Organization Profile', path: '/admin/org-settings', desc: 'NGO name, currency, logo, and contacts' },
  { name: 'Settings', path: '/admin/settings', desc: 'Security, roles, and administrative options' },
];

export function AdminTopbar({ setSidebarOpen }: { setSidebarOpen?: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { donations } = useNgoStore();
  const { organization } = useOrgStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const pendingDonations = donations.filter(d => d.status === 'Pending');

  // Match current route
  const currentPath = location.pathname;
  const currentRouteInfo = routeTitles[currentPath] || { title: 'Admin Area', category: 'Management' };

  const searchResults = searchQuery.trim() === ''
    ? []
    : searchablePages.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectPage = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-30">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          type="button" 
          className="lg:hidden p-2 -ml-2 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors" 
          onClick={() => setSidebarOpen?.(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium leading-none">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500">{currentRouteInfo.category}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-0.5">
            {currentRouteInfo.title}
          </h1>
        </div>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-4 text-slate-400 ml-3.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Quick jump (e.g., Donations, Campaigns, ID Cards)..."
            className="block w-full border border-slate-200 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 rounded-xl transition-all"
          />
        </div>

        {/* Quick jump search dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-1.5 space-y-0.5">
                {searchResults.map(result => (
                  <button
                    key={result.path}
                    type="button"
                    onClick={() => handleSelectPage(result.path)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex flex-col group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      {result.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {result.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Version Badge */}
        <div className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold tracking-wider shadow-2xs">
          <span>V31</span>
        </div>

        {/* Pending Donations Alert Pill */}
        {pendingDonations.length > 0 && (
          <Link
            to="/admin/donations"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title={`${pendingDonations.length} donations require review & receipt`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{pendingDonations.length} Pending Approval</span>
          </Link>
        )}

        {/* Public Website Preview Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          title="Open public website in a new window"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">Public Site</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
      </div>
    </header>
  );
}
