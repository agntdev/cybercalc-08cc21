import { describe, expect, it } from 'vitest';

import {
  buildChallenge,
  buildSharePayload,
  listMarketplaceThemes,
  moderateContent,
  socialShareUrl,
} from '../src/community.js';

describe('community features', () => {
  it('builds sanitized calculation share payloads', () => {
    const payload = buildSharePayload({ expression: '<2 + 2>', result: '{4}' });

    expect(payload.text).toBe('2 + 2 = 4');
    expect(payload.url).toContain('calc=2%20%2B%202');
  });

  it('ships a local theme marketplace', () => {
    expect(listMarketplaceThemes().map((theme) => theme.id)).toEqual([
      'neon',
      'matrix',
      'midnight',
    ]);
  });

  it('creates community challenges', () => {
    expect(buildChallenge({
      title: 'Daily Neon',
      expression: '12 × 12',
      target: '144',
    })).toMatchObject({
      id: 'challenge_daily-neon',
      difficulty: 'daily',
    });
  });

  it('builds social share URLs without posting automatically', () => {
    const payload = buildSharePayload({ expression: '1 + 1', result: '2' });
    expect(socialShareUrl('x', payload)).toContain('twitter.com/intent/tweet');
    expect(socialShareUrl('reddit', payload)).toContain('reddit.com/submit');
    expect(socialShareUrl('email', payload)).toContain('mailto:');
  });

  it('blocks moderated terms', () => {
    expect(moderateContent('normal calculation').approved).toBe(true);
    expect(moderateContent('spam calculation')).toEqual({
      approved: false,
      matchedTerms: ['spam'],
    });
  });
});
