import { hasSovereignDanger } from "./language-boundary.js";

const TRUTH_PATH_PREFIXES = [
  "law/",
  "current/",
  "epochs/current/",
  "authorities/current/",
  "receipts/current/",
  "verification/results/current/",
  "recognitions/current/",
  "recourse/current/"
];

const PROJECTION_PREFIXES = [
  "README.md",
  "docs/",
  "public/",
  "index.html",
  "404.html",
  "surface.host.json"
];

export function classifySurface(candidate) {
  const files = candidate.files || [];
  const touched = files.map(f => f.path);

  const truth_path_touched = touched.some(path =>
    TRUTH_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))
  );

  const projection_path_touched = touched.some(path =>
    PROJECTION_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))
  );

  const package_path_touched = touched.some(path =>
    path === "package.json" || path.startsWith("packages/") || path.includes("/package.json")
  );

  const workflow_path_touched = touched.some(path => path.startsWith(".github/workflows/"));

  const sovereign_language_detected = hasSovereignDanger(candidate);

  let surface_class = "UNKNOWN";
  if (truth_path_touched) surface_class = "PROTECTED_TRUTH_SURFACE";
  else if (sovereign_language_detected) surface_class = "SOVEREIGN_LANGUAGE_PROJECTION";
  else if (projection_path_touched) surface_class = "PROJECTION_SURFACE";
  else if (package_path_touched) surface_class = "PACKAGE_SURFACE";
  else if (workflow_path_touched) surface_class = "WORKFLOW_SURFACE";

  return {
    classifier: "ADMISSORIUM_SURFACE_CLASSIFIER",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    allowed_to_mutate_truth: false,
    surface_class,
    truth_path_touched,
    projection_path_touched,
    package_path_touched,
    workflow_path_touched,
    sovereign_language_detected,
    touched_paths: touched,
    allowed_to_mutate_truth: false
  };
}
