import { Guid } from "@tsonic/dotnet/System.js";

export function generateId(prefix: string = "id"): string {
  return prefix + "_" + Guid.NewGuid().ToString("N");
}
