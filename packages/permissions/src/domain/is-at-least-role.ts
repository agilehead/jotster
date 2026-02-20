export const isAtLeastRole = (
  userRole: number,
  requiredRole: number
): boolean => {
  return userRole <= requiredRole;
};
