import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useNgoStore } from './store/useNgoStore';
import { useOrgStore } from './store/useOrgStore';
import { AdminLayout } from './components/admin/AdminLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { PublicLayout } from './components/public/PublicLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Programs } from './pages/public/Programs';
import { Campaigns } from './pages/public/Campaigns';
import { Donate } from './pages/public/Donate';
import { Verify } from './pages/public/Verify';
import { Volunteer } from './pages/public/Volunteer';
import { Contact } from './pages/public/Contact';
import { Transparency } from './pages/public/Transparency';
import { TrackDonation } from './pages/public/TrackDonation';

// Admin Pages (existing from)
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Builder } from './pages/Builder';
import { Templates } from './pages/Templates';
import { OrgSettings } from './pages/OrgSettings';
import { PrintCenter } from './pages/PrintCenter';
import { Generator } from './pages/Generator';
import React from 'react';

import { AdminPrograms } from './pages/admin/Programs';
import { AdminCampaigns } from './pages/admin/Campaigns';
import { AdminDonations } from './pages/admin/Donations';
import { AdminEvents } from './pages/admin/Events';
import { AdminContent } from './pages/admin/Content';
import { AdminMessages } from './pages/admin/Messages';
import { AdminTransparency } from './pages/admin/Transparency';
import { AdminSettings } from './pages/admin/Settings';
import { SystemUsers } from './pages/admin/SystemUsers';
import { AuditLogs } from './pages/admin/AuditLogs';

export default function App() {
  const syncNgoWithUser = useNgoStore(state => state.syncNgoWithUser);
  const syncOrgWithFirebase = useOrgStore(state => state.syncWithFirebase);

  useEffect(() => {
    syncNgoWithUser('6a3a10qFoBbK4AI6pyFiMDpMW6h2');
    syncOrgWithFirebase('6a3a10qFoBbK4AI6pyFiMDpMW6h2');
  }, [syncNgoWithUser, syncOrgWithFirebase]);

  return (
    <Router>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="programs" element={<Programs />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="donate" element={<Donate />} />
          <Route path="verify" element={<Verify />} />
          <Route path="volunteer" element={<Volunteer />} />
          <Route path="contact" element={<Contact />} />
          <Route path="transparency" element={<Transparency />} />
          <Route path="track-donation" element={<TrackDonation />} />
        </Route>

        {/* Secure Admin Routes */}
        <Route path="/admin" element={<AuthLayout><AdminLayout /></AuthLayout>}>
          <Route index element={<Dashboard />} />
          <Route path="org-settings" element={<OrgSettings />} />
          <Route path="people" element={<Members initialTab="all" />} />
          <Route path="volunteers" element={<Members initialTab="volunteers" />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="donations" element={<AdminDonations />} />
          
          {/* Nested ID Cards Module */}
          <Route path="id-cards">
            <Route index element={<Templates />} />
            <Route path="builder" element={<Navigate to="/admin/people" replace />} />
            <Route path="print" element={<PrintCenter />} />
            <Route path="generate/:id" element={<Generator />} />
          </Route>

          <Route path="events" element={<AdminEvents />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="transparency" element={<AdminTransparency />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="system-users" element={<SystemUsers />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
