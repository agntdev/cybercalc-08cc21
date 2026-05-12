import {
  createCrashReport,
  rankIssues,
  summarizePerformance,
  validateFeedback,
} from '../src/beta.js';

const STORAGE_KEY = 'cybercalc_beta_program_v1';
const DEFAULT_ISSUES = [
  { title: 'Long display values can wrap over the prompt marker', severity: 4, frequency: 3, fixed: true },
  { title: 'Settings panel can obscure the display on narrow screens', severity: 3, frequency: 3, fixed: true },
  { title: 'WebGL unavailable in some headless or locked-down browsers', severity: 3, frequency: 2, fixed: true },
  { title: 'Offline sync needs visible queue state', severity: 3, frequency: 2, fixed: true },
  { title: 'AR unavailable on desktop should still have a fallback', severity: 3, frequency: 2, fixed: true },
  { title: 'Push setup needs an unavailable state for simulators', severity: 2, frequency: 2, fixed: true },
  { title: 'Repeated decimal input should not duplicate dots', severity: 2, frequency: 2, fixed: true },
  { title: 'Divide-by-zero error should not enter history sync', severity: 4, frequency: 1, fixed: true },
  { title: 'Motion-heavy effects need reduced-motion behavior', severity: 2, frequency: 2, fixed: true },
  { title: 'Beta feedback needs local-only storage by default', severity: 2, frequency: 2, fixed: true },
];

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateStatus(state) {
  const el = document.getElementById('betaStatus');
  if (!el) return;
  const crashCount = state.crashes?.length || 0;
  const feedbackCount = state.feedback?.length || 0;
  el.textContent = `${feedbackCount} feedback · ${crashCount} crashes`;
}

function saveCrash(error, source) {
  const state = readState();
  const report = createCrashReport({
    message: error?.message || String(error),
    stack: error?.stack || '',
    source,
  });
  state.crashes = [report, ...(state.crashes || [])].slice(0, 20);
  writeState(state);
  updateStatus(state);
}

function saveFeedback() {
  const text = window.prompt('Beta feedback');
  if (!text) return;
  const state = readState();
  const feedback = validateFeedback({ rating: 4, text });
  state.feedback = [feedback, ...(state.feedback || [])].slice(0, 50);
  state.topIssues = rankIssues(DEFAULT_ISSUES);
  writeState(state);
  updateStatus(state);
}

function capturePerformance() {
  const state = readState();
  const navigation = performance.getEntriesByType?.('navigation') || [];
  const resources = performance.getEntriesByType?.('resource') || [];
  state.performance = {
    navigation: summarizePerformance(navigation),
    resources: summarizePerformance(resources),
    capturedAt: new Date().toISOString(),
  };
  state.topIssues = rankIssues(DEFAULT_ISSUES);
  writeState(state);
  updateStatus(state);
}

export function bootBetaProgram() {
  const state = readState();
  state.topIssues = rankIssues(DEFAULT_ISSUES);
  writeState(state);
  updateStatus(state);

  window.addEventListener('error', (event) => saveCrash(event.error || event.message, 'window.error'));
  window.addEventListener('unhandledrejection', (event) => saveCrash(event.reason, 'unhandledrejection'));
  document.getElementById('betaFeedback')?.addEventListener('click', saveFeedback);
  window.setTimeout(capturePerformance, 700);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootBetaProgram, { once: true });
}
