export function renderQuarantineIssue(quarantineClass: string, reason: string) {
  return `ADMISSORIUM quarantine required\n\nClass: ${quarantineClass}\nReason: ${reason}\nDeletion allowed: false\n`;
}
