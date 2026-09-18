// Persistent deletion registry (Tombstones)
// Guarantees that when a user deletes a member, program, campaign, or event,
// it is permanently removed and NEVER resurrected by historical storage recovery,
// fallback seed arrays, or remote sync snapshots.

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

export function markIdDeleted(id: string | string[]): void {
  if (!id) return;
  const ids = Array.isArray(id) ? id : [id];
  const set = getDeletedIds();
  let changed = false;

  ids.forEach(item => {
    if (item && typeof item === 'string') {
      const trimmed = item.trim();
      if (!set.has(trimmed)) {
        set.add(trimmed);
        changed = true;
      }
    }
  });

  if (!changed) return;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOMBSTONE_STORAGE_KEY, JSON.stringify(Array.from(set)));
      // Deep purge across all legacy and current storage keys
      purgeDeletedIdsFromStorage(set);
      window.dispatchEvent(new CustomEvent('daksheba-record-deleted', {
        detail: { ids: ids.map(i => (typeof i === 'string' ? i.trim() : '')) }
      }));
    }
  } catch (e) {
    console.warn('Failed to persist tombstones:', e);
  }
}

export function propagateRecordDeletion(id: string | string[], entityType?: string): void {
  if (!id) return;
  markIdDeleted(id);
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
        const filtered = arr.filter(item => !item || !item.id || !set.has(item.id.trim()));
        if (filtered.length !== arr.length) wasModified = true;
        return filtered;
      };

      if (target && typeof target === 'object') {
        ['projects', 'campaigns', 'volunteers', 'events', 'news', 'donations', 'documents', 'members'].forEach(field => {
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
