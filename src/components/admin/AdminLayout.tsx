import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { useOrgStore } from '../../store/useOrgStore';
import { motion, AnimatePresence } from 'motion/react';

export function AdminLayout() {
  const { templates } = useOrgStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Auto-fix any templates that might still be landscape in localStorage
    let needsUpdate = false;
    const fixedTemplates = templates.map(t => {
      if (t.width > t.height || t.orientation === 'landscape') {
        needsUpdate = true;
        return {
          ...t,
          width: 53.98,
          height: 85.60,
          orientation: 'portrait' as const
        };
      }
      return t;
    });

    if (needsUpdate) {
      useOrgStore.setState({ templates: fixedTemplates });
    }
  }, [templates]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminTopbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
