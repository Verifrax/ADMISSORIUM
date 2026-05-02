import fs from "node:fs";
import path from "node:path";

export function loadJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function loadPolicy<T = unknown>(name: string): T {
  return loadJson<T>(path.join(process.cwd(), "policies", name));
}
