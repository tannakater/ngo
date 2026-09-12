import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import { useOrgStore } from '../../store/useOrgStore';
import { motion, AnimatePresence } from 'motion/react';

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { organization } = useOrgStore();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'Campaigns', path: '/campaigns' },
    { name: 'Verify ID', path: '/verify' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 sm:px-6 lg:px-8 text-sm flex justify-between items-center hidden md:flex">
        <div className="flex gap-6">
          <span>{organization.email || 'info@ngo.org'}</span>
          <span>{organization.phone || '+1 234 567 890'}</span>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Official Humanitarian & Community Trust</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              {organization.logoUrl ? (
                <img src={organization.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
              ) : (
                <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
                  {organization.name?.charAt(0) || 'N'}
                </div>
              )}
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                {organization.name || 'Global Hope NGO'}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                  {link.name}
                </Link>
              ))}
              <Link to="/donate" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Donate Now
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white absolute w-full">
            <div className="px-4 pt-2 pb-6 space-y-1 shadow-lg">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md">
                  {link.name}
                </Link>
              ))}
              <Link to="/donate" onClick={() => setIsMenuOpen(false)} className="mt-4 flex w-full justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-md font-semibold">
                <Heart className="w-5 h-5" />
                Donate Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-bold text-2xl text-white tracking-tight flex items-center gap-2">
              <Heart className="text-emerald-500 w-6 h-6" />
              {organization.name || 'Global Hope'}
            </span>
            <p className="text-sm leading-relaxed text-slate-400">
              Committed to making the world a better place through sustainable programs, emergency relief, and community empowerment.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-emerald-400">About Us</Link></li>
              <li><Link to="/programs" className="hover:text-emerald-400">Our Programs</Link></li>
              <li><Link to="/volunteer" className="hover:text-emerald-400">Become a Volunteer</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Transparency</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/financials" className="hover:text-emerald-400">Financial Reports</Link></li>
              <li><Link to="/policies" className="hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400">Terms of Service</Link></li>
              <li><Link to="/verify" className="hover:text-emerald-400">Verify Member ID</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>{organization.address || '123 Hope Street, NY 10001'}</li>
              <li>{organization.email || 'contact@ngo.org'}</li>
              <li>{organization.phone || '+1 (555) 123-4567'}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
          &copy; {new Date().getFullYear()} {organization.name || 'NGO'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
