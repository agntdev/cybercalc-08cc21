const BLOCKED_TERMS = ['spam', 'scam', 'hate', 'abuse'];

export function buildSharePayload({ expression, result, theme = 'neon' } = {}) {
  const safeExpression = clean(expression, 120);
  const safeResult = clean(result, 80);
  return {
    title: 'CyberCalc result',
    text: `${safeExpression} = ${safeResult}`,
    theme: clean(theme, 40),
    url: `https://agnt-gm.ai/projects/cybercalc-08cc21?calc=${encodeURIComponent(safeExpression)}`,
  };
}

export function listMarketplaceThemes() {
  return [
    { id: 'neon', name: 'Neon Core', accent: '#00f0ff', price: 0 },
    { id: 'matrix', name: 'Matrix Rain', accent: '#00ff88', price: 0 },
    { id: 'midnight', name: 'Midnight Magenta', accent: '#ff00aa', price: 0 },
  ];
}

export function buildChallenge({ title, expression, target, difficulty = 'daily' } = {}) {
  return {
    id: `challenge_${slug(title || expression || 'daily')}`,
    title: clean(title || 'Daily Calculation', 80),
    expression: clean(expression, 120),
    target: clean(target, 80),
    difficulty: clean(difficulty, 40),
  };
}

export function socialShareUrl(network, payload) {
  const text = encodeURIComponent(payload.text || '');
  const url = encodeURIComponent(payload.url || '');
  if (network === 'x') return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  if (network === 'reddit') return `https://www.reddit.com/submit?title=${text}&url=${url}`;
  return `mailto:?subject=${encodeURIComponent(payload.title || 'CyberCalc')}&body=${text}%20${url}`;
}

export function moderateContent(text) {
  const value = String(text || '').toLowerCase();
  const matchedTerms = BLOCKED_TERMS.filter((term) => value.includes(term));
  return {
    approved: matchedTerms.length === 0,
    matchedTerms,
  };
}

function clean(value, maxLength) {
  return String(value || '')
    .replace(/[<>{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function slug(value) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'daily';
}
