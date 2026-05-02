export function compileQuarantineRecord(repo: string, quarantineClass: string, reason: string) {
  return {
    quarantine_record_type: "ADMISSORIUM_QUARANTINE_RECORD",
    schema_version: "1.0.0",
    quarantine_id: `adm-q-${new Date().toISOString()}`,
    truth_warning: "NOT_TRUTH_SOURCE",
    subject: { repo },
    quarantine_class: quarantineClass,
    reason,
    deletion_allowed: false,
    merge_effect: "BLOCKED"
  };
}
