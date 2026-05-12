export const REQUIRED_LAUNCH_SECTIONS = [
  'marketingAssets',
  'appStoreOptimization',
  'influencerOutreach',
  'launchEvent',
  'communityEngagement',
];

export function validateLaunchPlan(plan = {}) {
  const missing = REQUIRED_LAUNCH_SECTIONS.filter((section) => !plan[section]);
  return {
    ready: missing.length === 0,
    missing,
    sectionCount: REQUIRED_LAUNCH_SECTIONS.length - missing.length,
  };
}

export function buildLaunchChecklist(plan = {}) {
  return REQUIRED_LAUNCH_SECTIONS.map((section) => ({
    section,
    complete: Boolean(plan[section]),
  }));
}

export function scoreLaunchChannel({ reach = 0, fit = 0, effort = 1 } = {}) {
  const safeEffort = Math.max(1, Number(effort) || 1);
  return Number((((Number(reach) || 0) * 0.4 + (Number(fit) || 0) * 0.6) / safeEffort).toFixed(2));
}
