import {
  buildSyncPayload,
  createCalculationRecord,
  firebaseConfigReady,
  mergeHistory,
  queueOfflineOperation,
  sanitizePreferences,
  userStatePath,
} from '../src/sync.js';

const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
const FIREBASE_STORE_URL = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const KEYS = Object.freeze({
  history: 'cybercalc_history_v1',
  preferences: 'cybercalc_preferences_v1',
  queue: 'cybercalc_sync_queue_v1',
  device: 'cybercalc_device_id_v1',
  localCloud: 'cybercalc_local_cloud_v1',
});

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function getDeviceId() {
  const existing = localStorage.getItem(KEYS.device);
  if (existing) return existing;

  const id = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(KEYS.device, id);
  return id;
}

class LocalCloudProvider {
  constructor(key = KEYS.localCloud) {
    this.key = key;
    this.name = 'local-offline';
  }

  async pull() {
    return readJson(this.key, null);
  }

  async push(payload) {
    writeJson(this.key, payload);
    return { provider: this.name, saved: true };
  }
}

class FirebaseCloudProvider {
  static async create(config, userId) {
    const [{ initializeApp }, firestore] = await Promise.all([
      import(FIREBASE_APP_URL),
      import(FIREBASE_STORE_URL),
    ]);
    const app = initializeApp(config);
    const db = firestore.getFirestore(app);

    return new FirebaseCloudProvider({
      db,
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      setDoc: firestore.setDoc,
      path: userStatePath(userId),
    });
  }

  constructor(firebase) {
    this.firebase = firebase;
    this.name = 'firebase';
  }

  ref() {
    const [collection, userId, app, documentId] = this.firebase.path.split('/');
    return this.firebase.doc(this.firebase.db, collection, userId, app, documentId);
  }

  async pull() {
    const snapshot = await this.firebase.getDoc(this.ref());
    return snapshot.exists() ? snapshot.data() : null;
  }

  async push(payload) {
    await this.firebase.setDoc(this.ref(), payload, { merge: true });
    return { provider: this.name, saved: true };
  }
}

class CyberCalcSync {
  constructor() {
    this.deviceId = getDeviceId();
    this.history = readJson(KEYS.history, []);
    this.preferences = readJson(KEYS.preferences, sanitizePreferences());
    this.queue = readJson(KEYS.queue, []);
    this.provider = new LocalCloudProvider();
    this.statusEl = null;
  }

  async init() {
    this.statusEl = document.getElementById('syncStatus');
    document.getElementById('syncNow')?.addEventListener('click', () => this.flush());
    window.addEventListener('online', () => this.flush());
    window.addEventListener('cybercalc:calculation', (event) => this.recordCalculation(event.detail));
    window.addEventListener('cybercalc:preferences-changed', (event) => this.savePreferences(event.detail));

    await this.configureProvider();
    await this.pull();
    this.updateStatus();
  }

  async configureProvider() {
    const config = window.CYBERCALC_FIREBASE_CONFIG;
    if (!firebaseConfigReady(config)) return;

    try {
      this.provider = await FirebaseCloudProvider.create(config, window.CYBERCALC_USER_ID);
    } catch {
      this.provider = new LocalCloudProvider();
    }
  }

  async pull() {
    const remote = await this.provider.pull();
    if (!remote) return;

    this.history = mergeHistory(this.history, remote.history);
    this.preferences = sanitizePreferences({ ...remote.preferences, ...this.preferences });
    this.persist();
  }

  async recordCalculation(detail = {}) {
    const record = createCalculationRecord(detail);
    this.history = mergeHistory([record], this.history);
    this.queue = queueOfflineOperation(this.queue, { type: 'history', createdAt: record.createdAt });
    this.persist();
    this.updateStatus('queued');
    await this.flush();
  }

  savePreferences(detail = {}) {
    this.preferences = sanitizePreferences({
      ...this.preferences,
      ...detail,
      soundEnabled: detail.soundEnabled ?? this.preferences.soundEnabled,
    });
    this.queue = queueOfflineOperation(this.queue, { type: 'preferences' });
    this.persist();
    this.updateStatus('queued');
  }

  persist() {
    writeJson(KEYS.history, this.history);
    writeJson(KEYS.preferences, this.preferences);
    writeJson(KEYS.queue, this.queue);
  }

  payload() {
    return buildSyncPayload({
      history: this.history,
      preferences: this.preferences,
      deviceId: this.deviceId,
    });
  }

  async flush() {
    if (!navigator.onLine) {
      this.updateStatus('offline');
      return;
    }

    try {
      await this.provider.push(this.payload());
      this.queue = [];
      writeJson(KEYS.queue, this.queue);
      this.updateStatus('synced');
    } catch {
      this.updateStatus('queued');
    }
  }

  updateStatus(state = this.queue.length ? 'queued' : 'ready') {
    if (!this.statusEl) return;
    const parts = [
      this.provider.name,
      `${this.history.length} calc${this.history.length === 1 ? '' : 's'}`,
      state,
    ];
    this.statusEl.textContent = parts.join(' · ');
    this.statusEl.dataset.state = state;
  }
}

if (typeof window !== 'undefined') {
  window.cyberSync = new CyberCalcSync();
  window.addEventListener('DOMContentLoaded', () => window.cyberSync.init(), { once: true });
}
