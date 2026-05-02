import fs from "node:fs";
import path from "node:path";

export function write_quarantine_record(name: string, data: unknown) {
  const outDir = path.join(process.cwd(), "reports", "current");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, name);
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
  return out;
}
