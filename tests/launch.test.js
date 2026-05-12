import { describe, expect, it } from 'vitest';

import {
  buildLaunchChecklist,
  REQUIRED_LAUNCH_SECTIONS,
  scoreLaunchChannel,
  validateLaunchPlan,
} from '../src/launch.js';

describe('launch campaign', () => {
  const completePlan = {
    marketingAssets: true,
    appStoreOptimization: true,
    influencerOutreach: true,
    launchEvent: true,
    communityEngagement: true,
  };

  it('requires every launch workstream', () => {
    expect(REQUIRED_LAUNCH_SECTIONS).toHaveLength(5);
    expect(validateLaunchPlan(completePlan)).toEqual({
      ready: true,
      missing: [],
      sectionCount: 5,
    });
  });

  it('reports missing launch sections', () => {
    expect(validateLaunchPlan({ marketingAssets: true }).missing).toEqual([
      'appStoreOptimization',
      'influencerOutreach',
      'launchEvent',
      'communityEngagement',
    ]);
  });

  it('builds a checklist for launch execution', () => {
    expect(buildLaunchChecklist(completePlan).every((item) => item.complete)).toBe(true);
  });

  it('scores channels by reach, fit, and effort', () => {
    expect(scoreLaunchChannel({ reach: 10, fit: 8, effort: 2 })).toBe(4.4);
  });
});
