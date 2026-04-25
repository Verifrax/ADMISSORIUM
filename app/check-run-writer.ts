import type { AdmissibilityReport } from "../src/types.js";
export function checkRunConclusion(report:AdmissibilityReport):"success"|"failure"|"neutral"{if(report.red_count>0||report.verdict==="INADMISSIBLE"||report.verdict==="QUARANTINED")return"failure";if(report.yellow_count>0||report.verdict==="REQUIRES_ACCEPTANCE_ACT")return"neutral";return"success";}
