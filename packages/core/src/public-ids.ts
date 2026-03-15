import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";

export const parseId = (value: string | undefined): long | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 1) {
    return undefined;
  }
  return Convert.ToInt64(parsed);
};
