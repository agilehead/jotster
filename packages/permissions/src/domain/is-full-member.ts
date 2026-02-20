export const isFullMember = (
  userRole: number,
  dateJoined: number,
  waitingPeriodThresholdDays: number,
  now: number
): boolean => {
  if (userRole > 400) return false;
  if (waitingPeriodThresholdDays === 0) return true;
  const duration = now - dateJoined;
  return duration >= waitingPeriodThresholdDays * 86400000;
};
