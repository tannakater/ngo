// Centralized Firestore Quota & Offline Manager
let quotaExhausted = false;

const listeners: ((exhausted: boolean) => void)[] = [];

export function isQuotaExhausted(): boolean {
  return quotaExhausted;
}

export function recordQuotaExhausted(err?: any): boolean {
  if (!err) return false;
  
  const isQuotaError = 
    err?.code === 'resource-exhausted' || 
    (typeof err?.message === 'string' && (
      err.message.toLowerCase().includes('quota exceeded') ||
      err.message.toLowerCase().includes('resource-exhausted')
    ));

  if (isQuotaError) {
    if (!quotaExhausted) {
      quotaExhausted = true;
      console.warn(
        '⚠️ [Firestore Notice] Daily read quota limit reached for free tier database. ' +
        'DakSeba Foundation platform is running in offline cached mode with local persistence.'
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
