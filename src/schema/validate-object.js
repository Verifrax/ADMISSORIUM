import fs from "node:fs";
import crypto from "node:crypto";

export function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function actualType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

export function validateObject(value, schema, pointer = "$") {
  const errors = [];

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${pointer}: expected const ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pointer}: expected enum ${schema.enum.join("|")}`);
  }

  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const got = actualType(value);
    if (!allowed.includes(got)) {
      errors.push(`${pointer}: expected ${allowed.join("|")} got ${got}`);
      return errors;
    }
  }

  if (schema.type === "object" || schema.properties) {
    const object = value || {};
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(object, key)) {
        errors.push(`${pointer}.${key}: missing required field`);
      }
    }

    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        errors.push(...validateObject(object[key], child, `${pointer}.${key}`));
      }
    }

    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(object)) {
        if (!allowed.has(key)) errors.push(`${pointer}.${key}: unexpected field`);
      }
    }
  }

  if (schema.type === "array" || schema.items) {
    const arr = Array.isArray(value) ? value : [];
    if (schema.minItems !== undefined && arr.length < schema.minItems) {
      errors.push(`${pointer}: expected minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && arr.length > schema.maxItems) {
      errors.push(`${pointer}: expected maxItems ${schema.maxItems}`);
    }
    if (schema.items) {
      arr.forEach((item, i) => errors.push(...validateObject(item, schema.items, `${pointer}[${i}]`)));
    }
  }

  return errors;
}

export function validateFile(schemaPath, objectPath) {
  const schemaText = fs.readFileSync(schemaPath, "utf8");
  const objectText = fs.readFileSync(objectPath, "utf8");
  const errors = validateObject(JSON.parse(objectText), JSON.parse(schemaText));

  return {
    schemaPath,
    objectPath,
    ok: errors.length === 0,
    errors,
    schema_sha256: sha256Text(schemaText),
    object_sha256: sha256Text(objectText)
  };
}
