// Centralized Firestore Quota & Offline Manager
let quotaExhausted = false;

// Check if quota exhaustion was flagged in this browser session
try {
  if (typeof window !== 'undefined' && sessionStorage.getItem('firestore_quota_exhausted') === 'true') {
    quotaExhausted = true;
  }
} catch (e) {}

const listeners: ((exhausted: boolean) => void)[] = [];

export function isQuotaExhausted(): boolean {
  return quotaExhausted;
}

export function recordQuotaExhausted(err?: any) {
  const isQuotaError = 
    err?.code === 'resource-exhausted' || 
    err?.message?.toLowerCase().includes('quota') ||
    err?.message?.toLowerCase().includes('resource-exhausted');

  if (isQuotaError || !err) {
    if (!quotaExhausted) {
      quotaExhausted = true;
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('firestore_quota_exhausted', 'true');
        }
      } catch (e) {}
      
      console.warn(
        '⚠️ [Firestore Notice] Daily read quota limit reached for free tier database. ' +
        'DakSeba Foundation platform is running seamlessly in offline cached mode with full local persistence.'
      );
      
      listeners.forEach(cb => {
        try { cb(true); } catch (e) {}
      });
    }
    return true;
  }
  return false;
}

export function resetQuotaStatus() {
  quotaExhausted = false;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('firestore_quota_exhausted');
    }
  } catch (e) {}
  listeners.forEach(cb => {
    try { cb(false); } catch (e) {}
  });
}

export function onQuotaChange(cb: (exhausted: boolean) => void) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
