export type AdmissionCountPolicy = {
  governed_repository_count: number;
  public_repository_count: number;
  sovereign_chamber_count: number;
  host_count: number;
  npm_package_count: number;
  core_package_order_count: number;
  pypi_package_boundary_count: number;
  private_internal_package_count: number;
};

export type AdmissionsObject = {
  schema: string;
  status: string;
  count_policy: AdmissionCountPolicy;
};

export type ProjectionCounts = Partial<AdmissionCountPolicy> & {
  label?: string;
};

export type AdmissionCountFinding = {
  severity: "RED" | "YELLOW";
  code: string;
  message: string;
};

export function assertAdmissionCountConvergence(
  admissions: AdmissionsObject,
  projection: ProjectionCounts
): AdmissionCountFinding[] {
  const findings: AdmissionCountFinding[] = [];

  if (admissions.status !== "ACTIVE_TRUTH") {
    findings.push({
      severity: "RED",
      code: "ADMISSIONS_NOT_ACTIVE_TRUTH",
      message: "Admissions object must be ACTIVE_TRUTH."
    });
  }

  for (const [key, accepted] of Object.entries(admissions.count_policy) as [keyof AdmissionCountPolicy, number][]) {
    const projected = projection[key];
    if (projected === undefined) continue;
    if (projected !== accepted) {
      findings.push({
        severity: "RED",
        code: `COUNT_MISMATCH_${String(key).toUpperCase()}`,
        message: `Projection count ${String(key)}=${projected} does not match admission count ${accepted}.`
      });
    }
  }

  if (
    projection.label &&
    /repos?\s+live|repositories/i.test(projection.label) &&
    projection.public_repository_count === admissions.count_policy.public_repository_count &&
    projection.governed_repository_count === undefined
  ) {
    findings.push({
      severity: "YELLOW",
      code: "REPOSITORY_LABEL_COLLAPSES_PUBLIC_AND_GOVERNED",
      message: "Projection says repositories/repos without distinguishing public repositories from governed repositories."
    });
  }

  return findings;
}
