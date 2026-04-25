import type { GraphNode } from "../../src/types.js";
export function buildCandidateGraph(liveRepos:string[]):GraphNode[]{return liveRepos.sort().map((repo)=>({id:repo,type:"Repo",status:"DERIVED_PROJECTION",owner_repo:repo,source_of_truth:"live materialization inventory",may_autofix:false,admissibility:"REQUIRES_ACCEPTANCE_ACT"}));}
