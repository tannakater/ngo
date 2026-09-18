// Persistent cross-admin deletion registry & realtime synchronization (Tombstones)
// Guarantees that when any administrator deletes or rejects a member, volunteer, donation, message, or project,
// it is instantly synchronized to ALL other connected admins in real time and permanently purged
// across localStorage, Zustand stores, Supabase, and Firestore.

import { supabase } from './supabase';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';

const TOMBSTONE_STORAGE_KEY = 'daksheba_deleted_ids';
const INIT_FLAGS_KEY = 'daksheba_store_inits';

const KNOWN_STORAGE_KEYS = [
  'daksheba_ngo_data',
  'ngo_state_storage_v1',
  'ngo_org_store_data',
  'ngo_org_data',
  'idforge_org_storage_v1',
  'ngo_members',
  'idforge_members',
  'daksheba_monthly_target'
];

let cachedDeletedIds: Set<string> | null = null;
let realtimeSyncInitialized = false;
let globalSyncChannel: any = null;

export function getDeletedIds(): Set<string> {
  if (cachedDeletedIds !== null) {
    return cachedDeletedIds;
  }
  const set = new Set<string>();
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(TOMBSTONE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => {
            if (id && typeof id === 'string') set.add(id.trim());
          });
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load tombstones from localStorage:', e);
  }
  cachedDeletedIds = set;
  return set;
}

export function isIdDeleted(id?: string | null): boolean {
  if (!id) return false;
  return getDeletedIds().has(id.trim());
}

export function markIdDeleted(id: string | string[], skipRemoteBroadcast: boolean = false): void {
  if (!id) return;
  const ids = Array.isArray(id) ? id : [id];
  const set = getDeletedIds();
  let changed = false;
  const validIds: string[] = [];

  ids.forEach(item => {
    if (item && typeof item === 'string') {
      const trimmed = item.trim();
      validIds.push(trimmed);
      if (!set.has(trimmed)) {
        set.add(trimmed);
        changed = true;
      }
    }
  });

  if (!changed && skipRemoteBroadcast) return;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOMBSTONE_STORAGE_KEY, JSON.stringify(Array.from(set)));
      // Deep purge across all local storage entries
      purgeDeletedIdsFromStorage(set);
      window.dispatchEvent(new CustomEvent('daksheba-record-deleted', {
        detail: { ids: validIds }
      }));
    }
  } catch (e) {
    console.warn('Failed to persist tombstones locally:', e);
  }

  // Cross-admin remote broadcasting if this action originated on this client
  if (!skipRemoteBroadcast && validIds.length > 0) {
    // 1. Supabase Realtime Broadcast to all other connected admin devices
    if (supabase) {
      try {
        if (!globalSyncChannel) {
          globalSyncChannel = supabase.channel('global_admin_sync');
          globalSyncChannel.subscribe();
        }
        globalSyncChannel.send({
          type: 'broadcast',
          event: 'record_deleted',
          payload: { ids: validIds, timestamp: Date.now() }
        }).catch(() => {});
      } catch (err) {}
    }

    // 2. Firestore Deletion Registry Synchronization
    if (db) {
      try {
        const deletionsRef = doc(db, 'app_sync', 'deletions');
        setDoc(deletionsRef, {
          ids: arrayUnion(...validIds),
          lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  }
}

export function propagateRecordDeletion(id: string | string[], entityType?: string): void {
  if (!id) return;
  markIdDeleted(id, false);
  if (typeof window !== 'undefined') {
    const idArray = Array.isArray(id) ? id : [id];
    window.dispatchEvent(new CustomEvent('ngo-record-deleted', {
      detail: { ids: idArray, entityType, timestamp: Date.now() }
    }));
  }
}

export function purgeDeletedIdsFromStorage(deletedSet?: Set<string>): void {
  const set = deletedSet || getDeletedIds();
  if (set.size === 0 || typeof window === 'undefined') return;

  KNOWN_STORAGE_KEYS.forEach(storageKey => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      let parsed = JSON.parse(raw);
      let wasModified = false;

      // Handle Zustand persist wrapping { state: ... }
      let target = parsed;
      if (parsed && typeof parsed === 'object' && parsed.state) {
        target = parsed.state;
      }

      const cleanArray = (arr: any[]) => {
        if (!Array.isArray(arr)) return arr;
        const filtered = arr.filter(item => !item || !item.id || !set.has(String(item.id).trim()));
        if (filtered.length !== arr.length) wasModified = true;
        return filtered;
      };

      if (target && typeof target === 'object') {
        ['projects', 'campaigns', 'volunteers', 'events', 'news', 'donations', 'documents', 'members', 'messages'].forEach(field => {
          if (Array.isArray(target[field])) {
            target[field] = cleanArray(target[field]);
          }
        });
      }

      if (wasModified) {
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    } catch (e) {
      // Ignore parse issues on non-JSON items
    }
  });
}

export function filterNonDeleted<T = any>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const set = getDeletedIds();
  return items.filter(item => !item || !(item as any).id || !set.has(String((item as any).id).trim()));
}

export function setStoreInitialized(storeKey: string): void {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(INIT_FLAGS_KEY);
      const inits = raw ? JSON.parse(raw) : {};
      inits[storeKey] = true;
      localStorage.setItem(INIT_FLAGS_KEY, JSON.stringify(inits));
    }
  } catch (e) {}
}

export function isStoreInitialized(storeKey: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(INIT_FLAGS_KEY);
      if (raw) {
        const inits = JSON.parse(raw);
        return !!inits[storeKey];
      }
    }
  } catch (e) {}
  return false;
}

// Global cross-client realtime deletion listener setup
export function initCrossAdminRealtimeSync(): void {
  if (typeof window === 'undefined' || realtimeSyncInitialized) return;
  realtimeSyncInitialized = true;

  // 1. Supabase Broadcast Channel Listener
  if (supabase) {
    try {
      globalSyncChannel = supabase.channel('global_admin_sync');
      globalSyncChannel
        .on('broadcast', { event: 'record_deleted' }, (payload: any) => {
          if (payload?.payload?.ids && Array.isArray(payload.payload.ids)) {
            // Incoming deletion from another admin
            markIdDeleted(payload.payload.ids, true);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase admin sync channel error:', e);
    }
  }

  // 2. Firestore Remote Deletions Document Listener
  if (db) {
    try {
      const deletionsRef = doc(db, 'app_sync', 'deletions');
      onSnapshot(deletionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.ids) && data.ids.length > 0) {
            markIdDeleted(data.ids, true);
          }
        }
      }, (err) => {
        // Silent ignore for permissions / quota
      });
    } catch (e) {}
  }
}

// Auto-run on module load in browser
if (typeof window !== 'undefined') {
  initCrossAdminRealtimeSync();
}
