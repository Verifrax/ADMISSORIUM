import { GOVERNED_REPOS_35 } from "../../src/constants.js";
import type { GraphNode } from "../../src/types.js";
export function buildAcceptedGraph():GraphNode[]{return GOVERNED_REPOS_35.map((repo)=>({id:repo,type:"Repo",status:repo==="Verifrax/ADMISSORIUM"?"DERIVED_PROJECTION":"ACTIVE_TRUTH",owner_repo:repo,source_of_truth:".github/governance/GOVERNED_REPOS.txt",may_autofix:false,admissibility:repo==="Verifrax/ADMISSORIUM"?"REQUIRES_ACCEPTANCE_ACT":"ADMISSIBLE",metadata:{expected_perimeter_count_after_admissorium:35}}));}
