import { describe, expect, it } from 'vitest';

import {
  createCrashReport,
  rankIssues,
  summarizePerformance,
  validateFeedback,
} from '../src/beta.js';

describe('beta testing helpers', () => {
  it('creates sanitized crash reports', () => {
    const report = createCrashReport({
      message: '<boom>',
      stack: '{stack}',
      source: 'window.error',
      createdAt: '2026-05-12T19:00:00Z',
    });

    expect(report.message).toBe('boom');
    expect(report.stack).toBe('stack');
    expect(report.id).toMatch(/^crash_/);
  });

  it('summarizes performance entries', () => {
    expect(summarizePerformance([
      { duration: 12.2 },
      { duration: 7.8 },
      { duration: 30 },
    ])).toEqual({ count: 3, averageDuration: 16.67, slowest: 30 });
  });

  it('sanitizes feedback and clamps rating', () => {
    const feedback = validateFeedback({
      rating: 9,
      text: '<great app>',
      email: 'beta@example.com',
    });

    expect(feedback.rating).toBe(5);
    expect(feedback.text).toBe('great app');
    expect(feedback.email).toBe('beta@example.com');
  });

  it('ranks top issues by severity and frequency', () => {
    const ranked = rankIssues([
      { title: 'low', severity: 1, frequency: 1 },
      { title: 'high', severity: 5, frequency: 3 },
      { title: 'medium', severity: 3, frequency: 2 },
    ]);

    expect(ranked.map((issue) => issue.title)).toEqual(['high', 'medium', 'low']);
  });
});
