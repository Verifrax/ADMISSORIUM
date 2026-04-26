import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActuatorReadiness,
  REQUIRED_ACTUATOR_PIPELINE_FILES
} from "../../reports/actuator-readiness.js";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "admissorium-actuator-readiness-"));
}

function write(root: string, path: string, content = "export const boundary = true;\n"): void {
  const fullPath = join(root, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

function writeAll(root: string): void {
  for (const path of REQUIRED_ACTUATOR_PIPELINE_FILES) {
    write(root, path);
  }
}

test("passes v0.3.0 actuator readiness when complete plan-only request pipeline exists", () => {
  const root = tempRoot();
  try {
    writeAll(root);

    const artifact = buildActuatorReadiness({ root });

    assert.equal(artifact.version, "0.3.0");
    assert.equal(artifact.ready, true);
    assert.equal(artifact.failed_count, 0);
    assert.equal(artifact.boundary.write_behavior, "NONE");
    assert.equal(artifact.boundary.server_binding, "NONE");
    assert.equal(artifact.boundary.execution, "PLAN_ONLY");
    assert.equal(artifact.boundary.token_exchange, "NOT_PERFORMED");
    assert.equal(artifact.boundary.truth_mutation, false);
    assert.equal(artifact.boundary.registry_mutation, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails v0.3.0 actuator readiness when request pipeline planner is absent", () => {
  const root = tempRoot();
  try {
    writeAll(root);
    rmSync(join(root, "app/actuator-request-pipeline-plan.ts"));

    const artifact = buildActuatorReadiness({ root });

    assert.equal(artifact.ready, false);
    assert.equal(
      artifact.requirements.find((item) => item.path === "app/actuator-request-pipeline-plan.ts")?.status,
      "FAIL"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails v0.3.0 actuator readiness when server binding is materialized", () => {
  const root = tempRoot();
  try {
    writeAll(root);
    write(root, "app/webhook-request-handler.ts", "export const server = createServer(() => undefined);\n");

    const artifact = buildActuatorReadiness({ root });

    assert.equal(artifact.ready, false);
    assert.equal(
      artifact.forbidden_materialization.find((item) => item.id === "NO_SERVER_BINDING")?.status,
      "FAIL"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails v0.3.0 actuator readiness when token exchange is materialized", () => {
  const root = tempRoot();
  try {
    writeAll(root);
    write(root, "app/installation-token-plan.ts", "export const token = createInstallationAccessToken();\n");

    const artifact = buildActuatorReadiness({ root });

    assert.equal(artifact.ready, false);
    assert.equal(
      artifact.forbidden_materialization.find((item) => item.id === "NO_INSTALLATION_TOKEN_EXCHANGE")?.status,
      "FAIL"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails v0.3.0 actuator readiness when repository write is materialized in plan-only path", () => {
  const root = tempRoot();
  try {
    writeAll(root);
    write(root, "app/actuator-request-pipeline-plan.ts", "export const write = createPullRequest();\n");

    const artifact = buildActuatorReadiness({ root });

    assert.equal(artifact.ready, false);
    assert.equal(
      artifact.forbidden_materialization.find((item) => item.id === "NO_REPOSITORY_WRITES")?.status,
      "FAIL"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
