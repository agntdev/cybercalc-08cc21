export function createCrashReport({ message, stack, source = 'runtime', createdAt } = {}) {
  return {
    id: `crash_${Math.abs(hash(`${message}|${stack}|${createdAt || ''}`)).toString(36)}`,
    source: clean(source, 40),
    message: clean(message || 'Unknown error', 160),
    stack: clean(stack || '', 600),
    createdAt: validDate(createdAt),
  };
}

export function summarizePerformance(entries = []) {
  const metrics = entries.reduce((acc, entry) => {
    if (!entry || typeof entry.duration !== 'number') return acc;
    acc.count += 1;
    acc.totalDuration += entry.duration;
    acc.slowest = Math.max(acc.slowest, entry.duration);
    return acc;
  }, { count: 0, totalDuration: 0, slowest: 0 });

  return {
    count: metrics.count,
    averageDuration: metrics.count ? Number((metrics.totalDuration / metrics.count).toFixed(2)) : 0,
    slowest: Number(metrics.slowest.toFixed(2)),
  };
}

export function validateFeedback({ rating, text, email } = {}) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 3));
  const safeText = clean(text, 500);
  const safeEmail = email ? clean(email, 120) : '';

  return {
    rating: safeRating,
    text: safeText,
    email: safeEmail.includes('@') ? safeEmail : '',
    createdAt: new Date().toISOString(),
  };
}

export function rankIssues(issues = []) {
  return [...issues]
    .map((issue) => ({
      title: clean(issue.title, 120),
      severity: Number(issue.severity) || 1,
      frequency: Number(issue.frequency) || 1,
      fixed: Boolean(issue.fixed),
    }))
    .sort((a, b) => (b.severity * b.frequency) - (a.severity * a.frequency))
    .slice(0, 10);
}

function clean(value, maxLength) {
  return String(value || '')
    .replace(/[<>{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function validDate(value) {
  return Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString();
}

function hash(value) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = ((result << 5) - result + value.charCodeAt(i)) | 0;
  }
  return result;
}
