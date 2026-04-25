import type { Finding } from "../src/types.js";
export function classifyRed(findings:Finding[]):Finding[]{return findings.filter((finding)=>finding.severity==="RED");}
