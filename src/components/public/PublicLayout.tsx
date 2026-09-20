import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X, Globe, Search, ShieldCheck } from 'lucide-react';
import { useOrgStore } from '../../store/useOrgStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { motion, AnimatePresence } from 'motion/react';

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { organization } = useOrgStore();
  const { language, toggleLanguage, setLanguage, t } = useLanguageStore();
  const location = useLocation();

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('about'), path: '/about' },
    { name: t('programs'), path: '/programs' },
    { name: t('campaigns'), path: '/campaigns' },
    { name: t('track_donation'), path: '/track-donation' },
    { name: t('verify_id'), path: '/verify' },
  ];

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm flex justify-between items-center">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline text-slate-300">{organization.email || 'info@ngo.org'}</span>
          <span className="text-slate-300">{organization.phone || '+880 1790-650636'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-slate-400">
            {t('topbar_tagline')}
          </span>

          {/* Bilingual Switcher in Top Bar */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                language === 'bn' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                language === 'en' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/daksheba.jpg" alt="Logo" className="h-10 w-10 rounded-full object-cover shadow-sm border border-slate-200" />
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-tight">
                  {organization.name || 'Dakseba Foundation'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                  {isBn ? 'মানবতার সেবায় নিবেদিত' : 'Humanitarian Trust'}
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`font-medium text-sm transition-colors ${
                      isActive 
                        ? 'text-emerald-600 font-bold' 
                        : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <Link 
                to="/donate" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Heart className="w-4 h-4 fill-current" />
                {t('donate_now')}
              </Link>
            </nav>

            {/* Mobile Actions: Language & Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>

              <button 
                className="p-2 text-slate-600" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full z-50">
            <div className="px-4 pt-2 pb-6 space-y-1 shadow-lg">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)} 
                  className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2">
                <Link 
                  to="/donate" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex w-full justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  {t('donate_now')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
              <Heart className="text-emerald-500 w-5 h-5 fill-current" />
              {organization.name || 'Dakseba Foundation'}
            </span>
            <p className="text-xs leading-relaxed text-slate-400">
              {isBn 
                ? 'মানবিক সহায়তা, শিক্ষা, স্বাস্থ্যসেবা ও সমাজের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াতে প্রতিশ্রুতিবদ্ধ একটি অরাজনৈতিক সেবাধর্মী প্রতিষ্ঠান।'
                : 'Committed to humanitarian relief, education, healthcare and empowerment for underserved communities.'}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {isBn ? 'প্রয়োজনীয় লিংক' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-emerald-400">{t('about')}</Link></li>
              <li><Link to="/programs" className="hover:text-emerald-400">{t('programs')}</Link></li>
              <li><Link to="/campaigns" className="hover:text-emerald-400">{t('campaigns')}</Link></li>
              <li><Link to="/track-donation" className="text-emerald-400 font-semibold hover:underline">{t('track_donation')}</Link></li>
              <li><Link to="/volunteer" className="hover:text-emerald-400">{t('volunteer')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {isBn ? 'স্বচ্ছতা ও নিরীক্ষা' : 'Transparency & Audit'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/transparency" className="hover:text-emerald-400">{t('transparency')}</Link></li>
              <li><Link to="/track-donation" className="hover:text-emerald-400">{t('track_donation')}</Link></li>
              <li><Link to="/verify" className="hover:text-emerald-400">{t('verify_id')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {isBn ? 'যোগাযোগ ও সহায়তা' : 'Contact & Desk'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>{organization.address || 'Dhaka, Bangladesh'}</li>
              <li>{organization.email || 'contact@dakseba.org'}</li>
              <li>{organization.phone || '+880 1790-650636'}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; {new Date().getFullYear()} {organization.name || 'Dakseba Foundation'}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/track-donation" className="hover:text-slate-400">{t('track_donation')}</Link>
            <Link to="/verify" className="hover:text-slate-400">{t('verify_id')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
