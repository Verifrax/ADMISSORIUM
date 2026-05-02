import crypto from "node:crypto";
import { assertProjectionOnly } from "./assert-projection-only.js";

export function compileDryRunRepairPlan(repo: string, files: string[]) {
  const assertion = assertProjectionOnly(files);
  const body = {
    repair_plan_type: "ADMISSORIUM_DRY_RUN_PROJECTION_REPAIR_PLAN",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    repo,
    allowed: assertion.projection_only_assertion,
    mode: "DRY_RUN_ONLY",
    truth_path_touched: assertion.protected_path_touched,
    protected_path_touched: assertion.protected_path_touched,
    projection_only_assertion: assertion.projection_only_assertion,
    files_to_change: files,
    requires_human_review: true
  };
  return {
    ...body,
    diff_sha256: crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")
  };
}
