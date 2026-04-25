import type { Finding } from "../src/types.js";
export function classifyYellow(findings:Finding[]):Finding[]{return findings.filter((finding)=>finding.severity==="YELLOW");}
