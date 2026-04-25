import type { Finding } from "../src/types.js";
export interface RepairPlanItem{finding_id:string;repo:string;surface:string;action:string;auto_pr_allowed:boolean;}
export function compileRepairPlan(findings:Finding[]):RepairPlanItem[]{return findings.map((finding)=>({finding_id:finding.finding_id,repo:finding.repo,surface:finding.surface,action:finding.recommended_action,auto_pr_allowed:finding.autofix_allowed}));}
