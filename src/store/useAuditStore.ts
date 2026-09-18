import { create } from 'zustand';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, setDoc, doc, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export type AuditAction = 
  | 'Created' 
  | 'Updated' 
  | 'Deleted' 
  | 'Approved' 
  | 'Rejected' 
  | 'Security' 
  | 'Exported' 
  | 'Verified'
  | 'Settings'
  | 'Login';

export type AuditCategory = 
  | 'Donations' 
  | 'Campaigns' 
  | 'Programs' 
  | 'Members' 
  | 'Volunteers' 
  | 'Security' 
  | 'Settings' 
  | 'Content' 
  | 'ID Cards'
  | 'General';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  action: AuditAction;
  category: AuditCategory;
  severity?: AuditSeverity;
  entity: string; // e.g. 'Member', 'Donation', 'Campaign', 'Admin User', 'Security Settings'
  entityId?: string;
  details: string;
  metadata?: Record<string, any>;
  performedBy: string;
  performedByEmail: string;
  performedByRole?: string;
  timestamp: string;
  ipAddress?: string;
}

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  syncLogs: () => void;
  addLog: (logData: {
    action: AuditAction;
    category?: AuditCategory;
    severity?: AuditSeverity;
    entity: string;
    entityId?: string;
    details: string;
    metadata?: Record<string, any>;
    performedBy?: string;
    performedByEmail?: string;
    performedByRole?: string;
  }) => Promise<void>;
  exportLogsToCSV: (logsToExport?: AuditLog[]) => void;
  exportLogsToJSON: (logsToExport?: AuditLog[]) => void;
  clearLocalLogs: () => void;
}

const LOCAL_STORAGE_KEY = 'idforge_audit_logs_v2';

function getStoredLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load local audit logs', e);
  }
  return [];
}

function saveStoredLogs(logs: AuditLog[]) {
  try {
    // Keep max 500 logs locally
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save local audit logs', e);
  }
}

// Infer category from entity string if not explicitly given
function inferCategory(entity: string, action: AuditAction): AuditCategory {
  const e = entity.toLowerCase();
  if (e.includes('donation') || e.includes('receipt') || e.includes('gift')) return 'Donations';
  if (e.includes('campaign') || e.includes('cause')) return 'Campaigns';
  if (e.includes('program') || e.includes('project')) return 'Programs';
  if (e.includes('volunteer')) return 'Volunteers';
  if (e.includes('member') || e.includes('staff')) return 'Members';
  if (e.includes('id card') || e.includes('template') || e.includes('credential')) return 'ID Cards';
  if (e.includes('admin') || e.includes('role') || e.includes('security') || e.includes('auth') || action === 'Security') return 'Security';
  if (e.includes('setting') || e.includes('profile') || e.includes('org')) return 'Settings';
  if (e.includes('news') || e.includes('article') || e.includes('story') || e.includes('transparency')) return 'Content';
  return 'General';
}

// Infer severity from action if not explicitly provided
function inferSeverity(action: AuditAction): AuditSeverity {
  if (action === 'Deleted' || action === 'Rejected') return 'warning';
  if (action === 'Approved' || action === 'Verified') return 'success';
  if (action === 'Security') return 'critical';
  return 'info';
}

let unsub: (() => void) | null = null;

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: getStoredLogs(),
  isLoading: false,

  syncLogs: () => {
    if (unsub) unsub();
    set({ isLoading: true });

    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));
      unsub = onSnapshot(q, (snap) => {
        const fetched: AuditLog[] = [];
        snap.forEach(d => {
          const data = d.data();
          fetched.push({
            ...data,
            id: d.id,
            category: data.category || inferCategory(data.entity || '', data.action || 'Updated'),
            severity: data.severity || inferSeverity(data.action || 'Updated'),
          } as AuditLog);
        });

        // Merge with local logs to prevent loss
        const local = getStoredLogs();
        const map = new Map<string, AuditLog>();
        
        // Add local first
        local.forEach(l => map.set(l.id, l));
        // Overwrite/add remote
        fetched.forEach(f => map.set(f.id, f));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        set({ logs: merged, isLoading: false });
        saveStoredLogs(merged);
      }, (err) => {
        console.warn('Audit logs remote sync warning (using local trail):', err.message);
        set({ isLoading: false });
      });
    } catch (e) {
      console.warn('Audit logs query init warning:', e);
      set({ isLoading: false });
    }
  },

  addLog: async (logData) => {
    const id = uuidv4();
    const user = auth.currentUser;
    const action = logData.action;
    const category = logData.category || inferCategory(logData.entity, action);
    const severity = logData.severity || inferSeverity(action);

    const log: AuditLog = {
      id,
      action,
      category,
      severity,
      entity: logData.entity,
      entityId: logData.entityId,
      details: logData.details,
      metadata: logData.metadata,
      performedBy: logData.performedBy || user?.displayName || 'Executive Directorate',
      performedByEmail: logData.performedByEmail || user?.email || 'admin@dakseba.org',
      performedByRole: logData.performedByRole || 'Administrator',
      timestamp: new Date().toISOString()
    };
    
    const currentLogs = [log, ...get().logs];
    currentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ logs: currentLogs });
    saveStoredLogs(currentLogs);

    try {
      await setDoc(doc(db, 'audit_logs', id), JSON.parse(JSON.stringify(log)));
    } catch (e) {
      // Graceful offline fallback
      console.warn('Audit log saved locally (remote write skipped):', e);
    }
  },

  exportLogsToCSV: (logsToExport) => {
    const data = logsToExport || get().logs;
    if (data.length === 0) return;

    const headers = ['Timestamp', 'Action', 'Category', 'Severity', 'Entity', 'Entity ID', 'Details', 'Actor Name', 'Actor Email', 'Metadata'];
    const rows = data.map(l => [
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.severity || 'info'}"`,
      `"${l.entity.replace(/"/g, '""')}"`,
      `"${(l.entityId || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.performedBy.replace(/"/g, '""')}"`,
      `"${l.performedByEmail.replace(/"/g, '""')}"`,
      `"${l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportLogsToJSON: (logsToExport) => {
    const data = logsToExport || get().logs;
    if (data.length === 0) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearLocalLogs: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ logs: [] });
  }
}));
