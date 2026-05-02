export function routeQuarantine(quarantineClass: string) {
  return {
    quarantine_class: quarantineClass,
    route: "GOVERNANCE_REVIEW_QUEUE",
    deletion_allowed: false
  };
}
