import {
  buildChallenge,
  buildSharePayload,
  listMarketplaceThemes,
  moderateContent,
  socialShareUrl,
} from '../src/community.js';

const KEY = 'cybercalc_community_v1';

function readState() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function writeState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function currentPayload() {
  return buildSharePayload({
    expression: document.getElementById('expression')?.textContent || 'CyberCalc',
    result: document.getElementById('display')?.textContent || '0',
    theme: readState().theme || 'neon',
  });
}

function updateStatus() {
  const state = readState();
  const el = document.getElementById('communityStatus');
  if (!el) return;
  el.textContent = `${state.theme || 'neon'} · ${(state.shares || []).length} shares`;
}

function installThemes() {
  const state = readState();
  state.themes = listMarketplaceThemes();
  state.theme ||= 'neon';
  writeState(state);
  updateStatus();
}

function shareCalculation(network = 'x') {
  const state = readState();
  const payload = currentPayload();
  const moderation = moderateContent(payload.text);
  if (!moderation.approved) {
    window.alert(`Blocked by moderation: ${moderation.matchedTerms.join(', ')}`);
    return;
  }

  state.shares = [payload, ...(state.shares || [])].slice(0, 20);
  state.lastShareUrl = socialShareUrl(network, payload);
  writeState(state);

  if (navigator.share) {
    navigator.share(payload).catch(() => {});
  }
  updateStatus();
}

function createDailyChallenge() {
  const state = readState();
  const challenge = buildChallenge({
    title: 'Daily neon precision',
    expression: document.getElementById('expression')?.textContent || '12 × 12',
    target: document.getElementById('display')?.textContent || '144',
  });
  state.challenges = [challenge, ...(state.challenges || [])].slice(0, 10);
  writeState(state);
  updateStatus();
}

export function bootCommunity() {
  installThemes();
  document.getElementById('communityShare')?.addEventListener('click', () => shareCalculation('x'));
  document.getElementById('communityChallenge')?.addEventListener('click', createDailyChallenge);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootCommunity, { once: true });
}
