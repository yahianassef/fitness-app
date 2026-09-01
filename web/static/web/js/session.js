// Session durability.
//
// This is a web app, so there is no iOS Keychain or Android Keystore to write to —
// those are native-only APIs. The correct web equivalent is asking the browser to
// mark this origin's storage as *persistent*, which exempts it from the automatic
// eviction that would otherwise wipe a saved session.
//
// That matters specifically on iOS: Safari clears script-written storage for sites
// you have not visited in ~7 days. Installing to the Home Screen and holding a
// persistent-storage grant are what keep you signed in between sessions.
//
// Deliberately NOT stored: the password. Nothing on this device can verify it, so
// keeping it would add real risk (people reuse passwords) and buy no security.

export async function requestPersistence() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return 'unsupported';
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function storageStatus() {
  const out = { persisted: false, usage: null, quota: null, supported: false };
  try {
    if (!navigator.storage) return out;
    out.supported = !!navigator.storage.persist;
    if (navigator.storage.persisted) out.persisted = await navigator.storage.persisted();
    if (navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      out.usage = est.usage;
      out.quota = est.quota;
    }
  } catch { /* leave defaults */ }
  return out;
}

// True when the app is running as an installed Home Screen app rather than a tab.
// Installed PWAs get materially better storage durability on iOS.
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

// A local backup, because device-only data has no server to fall back on.
export function exportBackup(payload) {
  return JSON.stringify({
    app: 'fitness-comeback',
    version: 1,
    exported_at: new Date().toISOString(),
    ...payload,
  }, null, 2);
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'fitness-comeback') {
    throw new Error('That file is not a Fitness Comeback backup.');
  }
  return data;
}
