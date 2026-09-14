import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../lib/firebase';

export interface AuditLog {
  id: string;
  action: string;
  entity: string; // 'Member', 'Admin', 'Settings', etc.
  entityId?: string;
  details: string;
  performedBy: string;
  performedByEmail: string;
  timestamp: string;
}

interface AuditState {
  logs: AuditLog[];
  syncLogs: () => void;
  addLog: (logData: Omit<AuditLog, 'id' | 'timestamp' | 'performedBy' | 'performedByEmail'>) => Promise<void>;
}

let unsub: (() => void) | null = null;

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  syncLogs: () => {
    if (unsub) unsub();
    const q = collection(db, 'audit_logs');
    unsub = onSnapshot(q, (snap) => {
      const fetched: AuditLog[] = [];
      snap.forEach(d => fetched.push({ ...d.data(), id: d.id } as AuditLog));
      fetched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ logs: fetched });
    }, (err) => {
      console.warn('Audit logs sync warning:', err.message);
    });
  },
  addLog: async (logData) => {
    const id = uuidv4();
    const user = auth.currentUser;
    const log: AuditLog = {
      ...logData,
      id,
      performedBy: user?.displayName || 'System/Public User',
      performedByEmail: user?.email || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    const currentLogs = [log, ...get().logs];
    currentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ logs: currentLogs });

    try {
      await setDoc(doc(db, 'audit_logs', id), JSON.parse(JSON.stringify(log)));
    } catch (e) {
      console.error('Failed to add audit log', e);
    }
  }
}));
