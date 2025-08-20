
export const cleanupAuthState = () => {
  try {
    // Remove common Supabase auth keys from localStorage
    const lsKeys = Object.keys(localStorage);
    for (const key of lsKeys) {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    }
    // Explicit known key (older SDKs)
    localStorage.removeItem('supabase.auth.token');

    // Remove from sessionStorage as well
    const ssKeys = Object.keys(sessionStorage || {});
    for (const key of ssKeys) {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    }

    // Also clear any cached Google tokens if present
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.toLowerCase().includes('google') || k.toLowerCase().includes('gapi')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  } catch (err) {
    console.warn('cleanupAuthState: encountered an error while clearing storage', err);
  }
};
